/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import { defaultImageSize } from '/scripts/core/helpers/constants.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from '/node_modules/three/examples/jsm/utils/SkeletonUtils.js';

class LibraryHandler {
    constructor() {
        this.library = {};
    }

    addNewAsset(blob, name, type, callback) {
        let assetId = uuidv4();
        this.library[assetId] = {
            'Blob': blob,
            'Name': name,
            'Type': type,
        }
        this._loadMesh(assetId, blob).then(() => { callback(assetId) });
    }

    load(library, jsZip, successCallback, errorCallback) {
        try {
            let loadPromises = [];
            for(let assetId in library) {
                let assetDetails = library[assetId];
                if(assetDetails['Type'] == AssetTypes.SHAPE) {
                    this.loadShape(assetId, assetDetails['Name']);
                    continue;
                } else if(assetDetails['Type'] == AssetTypes.LIGHT) {
                    this.loadLight(assetId, assetDetails['Name']);
                    continue;
                }
                let assetPath = assetDetails['Filepath'];
                let promise = jsZip.file(assetPath).async('blob').then((blob)=>{
                    this.library[assetId] = {
                        'Blob': blob,
                        'Name': assetDetails['Name'],
                        'Type': assetDetails['Type'],
                    }
                    return this._loadMesh(assetId, blob);
                });
                loadPromises.push(promise);
            }
            Promise.all(loadPromises).then(successCallback).catch(error => {
                if(errorCallback) errorCallback();
            });
        } catch(error) {
            console.error(error);
            if(errorCallback) errorCallback();
        }
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
            this.library[assetId] = {
                'Blob': blob,
                'Name': name,
                'Type': type,
            };
            this._loadMesh(assetId, blob).then(() => { callback(assetId) });
        });
    }

    loadShape(assetId, name) {
        if(assetId in this.library) return;
        this.library[assetId] = {
            'Name': name,
            'Type': AssetTypes.SHAPE,
        }
    }

    loadLight(assetId, name) {
        if(assetId in this.library) return;
        this.library[assetId] = {
            'Name': name,
            'Type': AssetTypes.LIGHT,
        }
    }

    _loadMesh(assetId, blob) {
        if(this.library[assetId]['Type'] == AssetTypes.MODEL) {
            return this._loadGLB(assetId, blob);
        } else if(this.library[assetId]['Type'] == AssetTypes.IMAGE) {
            return this._loadImage(assetId, blob);
        }
    }

    _loadGLB(assetId, blob) {
        return new Promise((resolve, reject) => {
            let objectURL = URL.createObjectURL(blob);
            let gltfLoader = new GLTFLoader();
            gltfLoader.load(objectURL, (gltf) => {
                this.library[assetId]['Mesh'] = gltf.scene;
                resolve();
            });
        });
    }

    _loadImage(assetId, blob) {
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
                    let geometry = new THREE.PlaneBufferGeometry(width, height);
                    let material = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true,
                    });
                    let mesh = new THREE.Mesh( geometry, material );
                    this.library[assetId]['Mesh'] = mesh;
                    resolve();
                }
            );
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
        return this.library[assetId]['Type'];
    }

    getAssetName(assetId) {
        if(assetId in this.library) return this.library[assetId]['Name'];
        return null;
    }

    reset() {
        let newLibrary = {};
        for(let assetId in this.library) {
            let assetType = this.library[assetId]['Type'];
            if(assetType == AssetTypes.LIGHT || assetType == AssetTypes.SHAPE) {
                newLibrary[assetId] = this.library[assetId];
            }
        }
        this.library = newLibrary;
    }

    getLibraryDetails(assetIds) {
        let libraryDetails = {};
        for(let assetId of assetIds) {
            let assetDetails = this.library[assetId];
            let assetType = assetDetails['Type'];
            libraryDetails[assetId] = {
                'Name': assetDetails['Name'],
                'Type': assetType,
            }
            if(assetType == AssetTypes.MODEL || assetType == AssetTypes.IMAGE) {
                let filepath = 'assets/' + assetId + "/" + assetDetails['Name'];
                libraryDetails[assetId]['Filepath'] = filepath;
            }
        }
        return libraryDetails;
    }
}

let libraryHandler = new LibraryHandler();
export default libraryHandler;
