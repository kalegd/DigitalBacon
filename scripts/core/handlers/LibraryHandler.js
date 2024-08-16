/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AssetScriptTypes from '/scripts/core/enums/AssetScriptTypes.js';
import AudioFileTypes from '/scripts/core/enums/AudioFileTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import ModelFileTypes from '/scripts/core/enums/ModelFileTypes.js';
import VideoFileTypes from '/scripts/core/enums/VideoFileTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { defaultImageSize } from '/scripts/core/helpers/constants.js';
import { blobToHash, buildBVH, uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';

const OPTIONAL_PARAMS = ['SketchfabID'];

class LibraryHandler {
    constructor() {
        this.library = {};
        this._blobHashMap = {};
        this._sketchfabIdMap = {};
    }

    addNewAsset(blob, name, type, callback) {
        blobToHash(blob).then((hash) => {
            if(hash in this._blobHashMap) {
                if(callback) callback(this._blobHashMap[hash]);
                return;
            }
            let assetId = uuidv4();
            this._blobHashMap[hash] = assetId;
            this.library[assetId] = {
                'Blob': blob,
                'Name': name,
                'Type': type,
                'Hash': hash,
            };
            this._loadAsset(assetId, blob).then(() => { callback(assetId); });
        });
    }

    addNewScript(blob, successCallback, errorCallback) {
        this._addNewScript(false, blob, successCallback, errorCallback);
    }

    _addNewScript(externalURL, blob, successCallback, errorCallback) {
        blobToHash(blob).then((hash) => {
            if(hash in this._blobHashMap) {
                if(successCallback) successCallback(this._blobHashMap[hash]);
                return;
            }
            let objectURL = URL.createObjectURL(blob);
            import(objectURL).then(module => {
                let moduleDefault = module.default || {};
                let { assetId, assetName, assetType } = moduleDefault;
                if(!assetId || !assetName || !assetType) {
                    console.error('Module provided does not have required '
                        +' static attributes (assetId, assetName, assetType)');
                    if(errorCallback) errorCallback();
                    return;
                }
                this._blobHashMap[hash] = assetId;
                this.library[assetId] = {
                    'Name': assetName,
                    'Type': assetType,
                    'Hash': hash,
                };
                if(externalURL) {
                    this.library[assetId]['URL'] = externalURL;
                    this.library[assetId]['IsExternal'] = true;
                } else {
                    this.library[assetId]['Blob'] = blob;
                }
                PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId,
                    true);
                if(successCallback) successCallback(assetId);
            }).catch((err) => {
                console.error(err);
                if(errorCallback) errorCallback();
            });
        });
    }

    load(library, jsZip, successCallback, errorCallback) {
        try {
            let loadPromises = [];
            for(let assetId in library) {
                let promise;
                let assetDetails = library[assetId];
                if(assetDetails['IsExternal']) {
                    promise = this.loadLibraryExternalAsset(assetId,
                        assetDetails);
                } else {
                    let assetPath = assetDetails['Filepath'];
                    promise = jsZip.file(assetPath).async('arraybuffer').then(
                        (arraybuffer) => this.loadLibraryAssetFromArrayBuffer(
                            assetId, assetDetails, [arraybuffer]));
                }
                loadPromises.push(promise);
            }
            Promise.all(loadPromises).then(successCallback).catch(error => {
                console.log(error);
                if(errorCallback) errorCallback();
            });
        } catch(error) {
            console.error(error);
            if(errorCallback) errorCallback();
        }
    }

    loadLibraryExternalAsset(assetId, assetDetails) {
        if(assetDetails['Type'] == AssetTypes.VIDEO) {
            return this._loadLibraryExternalVideoAsset(assetId, assetDetails);
        }
        return fetch(assetDetails['URL'])
            .then((response) => response.arrayBuffer())
            .then((arraybuffer) => this.loadLibraryAssetFromArrayBuffer(
                assetId, assetDetails, [arraybuffer]));
    }

    _loadLibraryExternalVideoAsset(assetId, assetDetails) {
        let url = assetDetails.URL;
        if(url in this._blobHashMap) return;
        return fetch(url, { method: 'HEAD' }).then((response) => {
            if(!response.ok) throw new Error('URL could not be fetched');
            this._blobHashMap[url] = assetId;
            this.library[assetId] = {
                'Name': assetDetails['Name'],
                'Type': assetDetails['Type'],
                'Hash': url,
                'IsExternal': true,
                'URL': url,
            };
        });
    }

    loadLibraryAssetFromArrayBuffer(assetId, assetDetails, arraybuffers) {
        let options;
        if(assetDetails['Type'] in AssetScriptTypes)
            options = { type: 'application/javascript' };
        let blob = new Blob(arraybuffers, options);
        return this.loadLibraryAsset(assetId, assetDetails, blob);
    }

    loadLibraryAsset(assetId, assetDetails, blob) {
        return blobToHash(blob).then((hash) => {
            if(hash in this._blobHashMap) return;
            this._blobHashMap[hash] = assetId;
            this.library[assetId] = {
                'Name': assetDetails['Name'],
                'Type': assetDetails['Type'],
                'Hash': hash,
            };
            if(assetDetails['IsExternal']) {
                this.library[assetId]['URL'] = assetDetails['URL'];
                this.library[assetId]['IsExternal'] = true;
            } else {
                this.library[assetId]['Blob'] = blob;
            }
            for(let key of OPTIONAL_PARAMS) {
                if(assetDetails[key])
                    this.library[assetId][key] = assetDetails[key];
            }
            if(assetDetails['SketchfabID'])
                this._sketchfabIdMap[assetDetails['SketchfabID']] = assetId;
            return this._loadAsset(assetId, blob, true);
        });
    }

    loadAsset(filepath, successCallback, errorCallback) {
        this._loadAssetFromURL(false, filepath, successCallback, errorCallback);
    }

    loadExternalAsset(url, successCallback, errorCallback) {
        this._loadAssetFromURL(true, url, successCallback, errorCallback);
    }

    loadBuiltIn(assetClass) {
        if(assetClass.assetId in this.library) return;
        this.library[assetClass.assetId] = {
            'Name': assetClass.assetName,
            'Type': assetClass.assetType,
            'IsBuiltIn': true,
        };
    }

    _loadAssetFromURL(isExternal, url, successCallback, errorCallback) {
        let name = url.split('/').pop();
        let assetId = uuidv4();
        let extension = name.split('.').pop().toLowerCase();
        let type;
        if(extension in AudioFileTypes) {
            type = AssetTypes.AUDIO;
        } else if(extension in ImageFileTypes) {
            type = AssetTypes.IMAGE;
        } else if(extension in ModelFileTypes) {
            type = AssetTypes.MODEL;
        } else if(extension in VideoFileTypes) {
            type = AssetTypes.VIDEO;
            if(isExternal) {
                this._loadExternalVideo(assetId, url, name, successCallback,
                    errorCallback);
                return;
            }
        }
        fetch(url).then((response) => {
            if(!response.ok) throw new Error('URL could not be fetched');
            return response.blob();
        }).then((blob) => {
            if(extension == 'js') {
                this._addNewScript(isExternal && url, blob, successCallback,
                    errorCallback);
                return;
            }
            blobToHash(blob).then((hash) => {
                if(hash in this._blobHashMap) {
                    if(successCallback)
                        successCallback(this._blobHashMap[hash]);
                    return;
                }
                this._blobHashMap[hash] = assetId;
                this.library[assetId] = {
                    'Name': name,
                    'Type': type,
                    'Hash': hash,
                };
                if(isExternal) {
                    this.library[assetId]['URL'] = url;
                    this.library[assetId]['IsExternal'] = true;
                } else {
                    this.library[assetId]['Blob'] = blob;
                }
                this._loadAsset(assetId, blob).then(() => {
                    if(successCallback) successCallback(assetId);
                });
            });
        }).catch((error) => {
            if(errorCallback) errorCallback(error);
        });
    }

    _loadExternalVideo(assetId, url, name, successCallback, errorCallback) {
        if(url in this._blobHashMap) {
            if(successCallback) successCallback(this._blobHashMap[url]);
            return;
        }
        fetch(url, { method: 'HEAD' }).then((response) => {
            if(!response.ok) throw new Error('URL could not be fetched');
            this._blobHashMap[url] = assetId;
            this.library[assetId] = {
                'Name': name,
                'Type': AssetTypes.VIDEO,
                'Hash': url,
                'IsExternal': true,
                'URL': url,
            };
            PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId, true);
            if(successCallback) successCallback(assetId);
        }).catch((error) => {
            if(errorCallback) errorCallback(error);
        });
    }

    _loadAsset(assetId, blob, ignorePublish) {
        if(this.library[assetId]['Type'] == AssetTypes.MODEL) {
            return this._loadGLB(assetId, blob, ignorePublish);
        } else if(this.library[assetId]['Type'] == AssetTypes.IMAGE) {
            return this._loadImage(assetId, blob, ignorePublish);
        } else if(this.library[assetId]['Type'] == AssetTypes.AUDIO) {
            return this._loadAudio(assetId, blob, ignorePublish);
        } else if(this.library[assetId]['Type'] == AssetTypes.VIDEO) {
            return this._loadVideo(assetId, blob, ignorePublish);
        } else {
            return this._loadScript(assetId, blob, ignorePublish);
        }
    }

    _loadGLB(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            let gltfLoader = new GLTFLoader();
            gltfLoader.load(objectURL, (gltf) => {
                this.library[assetId]['Mesh'] = gltf.scene;
                buildBVH(gltf.scene);
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId,
                        true);
                resolve();
            }, null, reject);
        });
    }

    _loadImage(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            new THREE.TextureLoader().load(objectURL, (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                let width = texture.image.width;
                let height = texture.image.height;
                if(width > height) {
                    height *= defaultImageSize / width;
                    width = defaultImageSize;
                } else {
                    width *= defaultImageSize / height;
                    height = defaultImageSize;
                }
                let geometry = new THREE.PlaneGeometry(width, height);
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                });
                let mesh = new THREE.Mesh( geometry, material );
                this.library[assetId]['Mesh'] = mesh;
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId,
                        true);
                resolve();
            }, null, reject);
        });
    }

    _loadAudio(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            new THREE.AudioLoader().load(objectURL, (buffer) => {
                this.library[assetId]['Buffer'] = buffer;
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId,
                        true);
                resolve();
            }, null, reject);
        });
    }

    _loadVideo(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            try {
                let objectURL = URL.createObjectURL(blob);
                this.library[assetId]['URL'] = objectURL;
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId,
                        true);
                resolve();
            } catch {
                reject();
            }
        });
    }

    _loadScript(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            import(objectURL).then(() => {
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId,
                        true);
                resolve();
            }).catch(reject);
        });
    }

    cloneMesh(assetId) {
        let assetDetails = this.library[assetId];
        if(assetDetails['Type'] == AssetTypes.IMAGE) {
            return assetDetails['Mesh'].clone();
        } else if(assetDetails['Type'] == AssetTypes.MODEL) {
            return clone(assetDetails['Mesh']);
        }
    }

    getBuffer(assetId) {
        if(!assetId) return;
        let assetDetails = this.library[assetId];
        if(assetDetails['Type'] == AssetTypes.AUDIO) {
            return assetDetails['Buffer'];
        }
    }

    getTexture(assetId) {
        let assetDetails = this.library[assetId];
        return assetDetails['Mesh'].material.map;
    }

    cloneTexture(assetId) {
        let assetDetails = this.library[assetId];
        return assetDetails['Mesh'].material.map.clone();
    }

    filterAssets(assetIds) {
        for(let assetId in this.library) {
            let asset = this.library[assetId];
            if(!assetIds.has(assetId) && !asset['IsBuiltIn']) {
                delete this.library[assetId];
                delete this._blobHashMap[asset.Hash];
                delete this._sketchfabIdMap[asset['SketchfabID']];
            }
        }
    }

    getAssetName(assetId) {
        if(assetId in this.library) return this.library[assetId]['Name'];
        return null;
    }

    getAssetIdFromSketchfabId(sketchfabId) {
        return this._sketchfabIdMap[sketchfabId];
    }

    getImage(assetId) {
        let assetDetails = this.library[assetId];
        return assetDetails['Mesh'].material.map.image;
    }

    getLibrary() {
        return this.library;
    }

    getType(assetId) {
        if(assetId in this.library) return this.library[assetId]['Type'];
        return null;
    }

    getUrl(assetId) {
        if(assetId in this.library) return this.library[assetId]['URL'];
        return null;
    }

    registerSketchfabAsset(assetId, sketchfabAsset) {
        let asset = this.library[assetId];
        if(!asset) {
            console.error('Asset ID not found for Sketchfab asset');
            return;
        }
        if(sketchfabAsset.uid) {
            asset['SketchfabID'] = sketchfabAsset.uid;
            this._sketchfabIdMap[sketchfabAsset.uid] = assetId;
        }
    }

    reset() {
        let newLibrary = {};
        for(let assetId in this.library) {
            if(this.library[assetId]['IsBuiltIn']) {
                newLibrary[assetId] = this.library[assetId];
            }
        }
        this.library = newLibrary;
        this._blobHashMap = {};
        this._sketchfabIdMap = {};
    }

    getLibraryDetails(assetIds) {
        let libraryDetails = {};
        for(let assetId of assetIds) {
            let assetDetails = this.library[assetId];
            if(assetDetails['IsBuiltIn']) continue;//Built-in asset
            let assetType = assetDetails['Type'];
            libraryDetails[assetId] = {
                'Name': assetDetails['Name'],
                'Type': assetType,
            };
            for(let key of OPTIONAL_PARAMS) {
                if(assetDetails[key])
                    libraryDetails[assetId][key] = assetDetails[key];
            }
            if(assetDetails['IsExternal']) {
                libraryDetails[assetId]['URL'] = assetDetails['URL'];
                libraryDetails[assetId]['IsExternal'] = true;
                continue;
            }
            let filepath = 'assets/' + assetId + "/" + assetDetails['Name'];
            libraryDetails[assetId]['Filepath'] = filepath;
        }
        return libraryDetails;
    }
}

let libraryHandler = new LibraryHandler();
export default libraryHandler;
