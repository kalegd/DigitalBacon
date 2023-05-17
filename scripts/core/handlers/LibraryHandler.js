/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AssetScriptTypes from '/scripts/core/enums/AssetScriptTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { defaultImageSize } from '/scripts/core/helpers/constants.js';
import { blobToHash, uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';

const OPTIONAL_PARAMS = ['License', 'Author', 'Preview Image URL',
    'Sketchfab Link', 'Sketchfab ID'];

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
            }
            this._loadAsset(assetId, blob).then(() => { callback(assetId) });
        });
    }

    addNewScript(blob, successCallback, errorCallback) {
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
                    'Blob': blob,
                    'Name': assetName,
                    'Type': assetType,
                };
                PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId);
                if(successCallback) successCallback(assetId);
            });
        });
    }

    load(library, jsZip, successCallback, errorCallback) {
        try {
            let loadPromises = [];
            for(let assetId in library) {
                let assetDetails = library[assetId];
                let type = assetDetails['Type'];
                //TODO: Remove below 1 line in July
                if(!assetDetails['Filepath']) continue;//Built-in asset
                let assetPath = assetDetails['Filepath'];
                let promise = jsZip.file(assetPath).async('arraybuffer')
                    .then((arraybuffer)=>{
                        let options;
                        if(type in AssetScriptTypes)
                            options = { type: 'application/javascript' };
                        let blob = new Blob([arraybuffer], options);
                        return this.loadLibraryAsset(assetId, assetDetails, blob);
                    });
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

    loadLibraryAsset(assetId, assetDetails, blob) {
        return blobToHash(blob).then((hash) => {
            if(hash in this._blobHashMap) return;
            this._blobHashMap[hash] = assetId;
            this.library[assetId] = {
                'Blob': blob,
                'Name': assetDetails['Name'],
                'Type': assetDetails['Type'],
            }
            for(let key of OPTIONAL_PARAMS) {
                if(assetDetails[key])
                    this.library[assetId][key] = assetDetails[key];
            }
            if(assetDetails['Sketchfab ID'])
                this._sketchfabIdMap[assetDetails['Sketchfab ID']] = assetId;
            return this._loadAsset(assetId, blob, true);
        });
    }

    loadAsset(filepath, callback) {
        let name = filepath.split('/').pop();
        let assetId = uuidv4();
        let extension = name.split('.').pop().toLowerCase();
        let type;
        if(extension in ImageFileTypes) {
            type = AssetTypes.IMAGE;
        } else if(extension == "glb") {
            type = AssetTypes.MODEL;
        }
        fetch(filepath).then(response => response.blob()).then((blob) => {
            if(extension == 'js') {
                this.addNewScript(blob, callback);
                return;
            }
            blobToHash(blob).then((hash) => {
                if(hash in this._blobHashMap) {
                    if(callback) callback(this._blobHashMap[hash]);
                    return;
                }
                this._blobHashMap[hash] = assetId;
                this.library[assetId] = {
                    'Blob': blob,
                    'Name': name,
                    'Type': type,
                };
                this._loadAsset(assetId, blob).then(() => { callback(assetId)});
            });
        });
    }

    loadBuiltIn(assetClass) {
        if(assetClass.assetId in this.library) return;
        this.library[assetClass.assetId] = {
            'Name': assetClass.assetName,
            'Type': assetClass.assetType,
        }
    }

    _loadAsset(assetId, blob, ignorePublish) {
        if(this.library[assetId]['Type'] == AssetTypes.MODEL) {
            return this._loadGLB(assetId, blob, ignorePublish);
        } else if(this.library[assetId]['Type'] == AssetTypes.IMAGE) {
            return this._loadImage(assetId, blob, ignorePublish);
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
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId);
                resolve();
            });
        });
    }

    _loadImage(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            new THREE.TextureLoader().load(objectURL,
                (texture) => {
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
                    if(!ignorePublish) {
                        PubSub.publish(this._id, PubSubTopics.ASSET_ADDED,
                            assetId);
                    }
                    resolve();
                }
            );
        });
    }

    _loadScript(assetId, blob, ignorePublish) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            import(objectURL).then(module => {
                if(!ignorePublish)
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId);
                resolve();
            });
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

    getTexture(assetId) {
        let assetDetails = this.library[assetId];
        return assetDetails['Mesh'].material.map;
    }

    cloneTexture(assetId) {
        let assetDetails = this.library[assetId];
        return assetDetails['Mesh'].material.map.clone();
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

    getAssetName(assetId) {
        if(assetId in this.library) return this.library[assetId]['Name'];
        return null;
    }

    getAssetIdFromSketchfabId(sketchfabId) {
        return this._sketchfabIdMap[sketchfabId];
    }

    setSketchfabDetails(assetId, sketchfabAsset) {
        let asset = this.library[assetId];
        if(!asset) {
            console.error('Asset ID not found when setting Sketchfab Details');
            return;
        }
        if(sketchfabAsset.previewUrl)
            asset['Preview Image URL'] = sketchfabAsset.previewUrl;
        if(sketchfabAsset.license)
            asset['License'] = sketchfabAsset.license.label;
        if(sketchfabAsset.user && sketchfabAsset.user.username)
            asset['Author'] = 'Sketchfab User ' + sketchfabAsset.user.username;
        if(sketchfabAsset.viewerUrl)
            asset['Sketchfab Link'] = sketchfabAsset.viewerUrl;
        if(sketchfabAsset.uid) {
            asset['Sketchfab ID'] = sketchfabAsset.uid;
            this._sketchfabIdMap[sketchfabAsset.uid] = assetId;
        }
        if(sketchfabAsset.previewTexture)
            asset.previewTexture = sketchfabAsset.previewTexture;
    }

    reset() {
        let newLibrary = {};
        for(let assetId in this.library) {
            if(!this.library[assetId]['Blob']) {
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
            if(!assetDetails['Blob']) continue;//Built-in asset
            let assetType = assetDetails['Type'];
            libraryDetails[assetId] = {
                'Name': assetDetails['Name'],
                'Type': assetType,
            }
            for(let key of OPTIONAL_PARAMS) {
                if(assetDetails[key])
                    libraryDetails[assetId][key] = assetDetails[key];
            }
            if(assetType == AssetTypes.MODEL || assetType == AssetTypes.IMAGE || assetType == AssetTypes.COMPONENT) {
                let filepath = 'assets/' + assetId + "/" + assetDetails['Name'];
                libraryDetails[assetId]['Filepath'] = filepath;
            }
        }
        return libraryDetails;
    }
}

let libraryHandler = new LibraryHandler();
export default libraryHandler;
