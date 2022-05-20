/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import ClampedTexturePlane from '/scripts/core/assets/ClampedTexturePlane.js';
import GLTFAsset from '/scripts/core/assets/GLTFAsset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';
  
class ProjectHandler {
    constructor() {
        this._lightClassMap = {};
        this._shapeClassMap = {};
    }

    init(scene) {
        this._scene = scene;
        this._id = uuidv4();
        this._objects = [];
        this.project = {};
        SettingsHandler.init(scene);
    }

    load(projectFilePath, successCallback, errorCallback) {
        JSZipUtils.getBinaryContent(projectFilePath, (err, data) => {
            if(err) {
                if(errorCallback) errorCallback(err);
                return;
            }
            JSZip.loadAsync(data).then((jsZip) => {
                this.loadZip(jsZip, () => {
                    if(successCallback) successCallback();
                }, () => {
                    if(errorCallback) errorCallback();
                });
            });
        });
    }

    loadZip(jsZip, successCallback, errorCallback) {
        this.reset();
        let lock = uuidv4();
        global.loadingLocks.add(lock);
        jsZip.file("projectDetails.json").async("string").then(
            (projectDetailsString) => {
                let projectDetails;
                try {
                    projectDetails = JSON.parse(projectDetailsString);
                } catch(error) {
                    this._handleLoadingError(errorCallback);
                    return;
                }
                LibraryHandler.load(projectDetails['library'], jsZip, () => {
                    global.loadingLocks.delete(lock);
                    SettingsHandler.load(projectDetails['settings']);
                    TexturesHandler.load(projectDetails['textures']);
                    MaterialsHandler.load(projectDetails['materials']);
                    try {
                        for(let assetId in projectDetails['assets']) {
                            let instances = projectDetails['assets'][assetId];
                            let type = LibraryHandler.getType(assetId);
                            if(type == AssetTypes.IMAGE) {
                                this._addImages(instances, true);
                            } else if(type == AssetTypes.MODEL) {
                                this._addGLTFs(instances, true);
                            } else if(type == AssetTypes.LIGHT) {
                                this._addLights(instances, assetId, true);
                            } else if(type == AssetTypes.SHAPE) {
                                this._addShapes(instances, assetId, true);
                            }
                        }
                    } catch(error) {
                        console.error(error);
                        this._handleLoadingError(errorCallback);
                        return;
                    }
                    PubSub.publish(this._id, PubSubTopics.PROJECT_LOADING,true);
                    if(successCallback) successCallback();
                }, () => { this._handleLoadingError(errorCallback); });
            }, () => { this._handleLoadingError(errorCallback); });
    }

    _handleLoadingError(errorCallback) {
        PubSub.publish(this._id, PubSubTopics.PROJECT_LOADING, true);
        if(errorCallback) errorCallback();
    }

    _addImages(instancesParams, ignoreUndoRedo) {
        for(let params of instancesParams) {
            this.addImage(params, ignoreUndoRedo);
        }
    }

    addImage(params, ignoreUndoRedo) {
        let image = new ClampedTexturePlane(params);
        image.addToScene(this._scene);
        this._addAsset(image, ignoreUndoRedo);
        return image;
    }

    _addGLTFs(instancesParams, ignoreUndoRedo) {
        for(let params of instancesParams) {
            this.addGLTF(params, ignoreUndoRedo);
        }
    }

    addGLTF(params, ignoreUndoRedo) {
        let gltf = new GLTFAsset(params);
        gltf.addToScene(this._scene);
        this._addAsset(gltf, ignoreUndoRedo);
        return gltf;
    }

    _addLights(instancesParams, assetId, ignoreUndoRedo) {
        for(let params of instancesParams) {
            this.addLight(params, assetId, ignoreUndoRedo);
        }
    }

    addLight(params, assetId, ignoreUndoRedo) {
        let instance = new this._lightClassMap[assetId](params);
        instance.addToScene(this._scene);
        this._addAsset(instance, ignoreUndoRedo);
        return instance;
    }

    registerLight(lightClass, assetId, assetName) {
        this._lightClassMap[assetId] = lightClass;
        LibraryHandler.loadLight(assetId, assetName);
    }

    _addShapes(instancesParams, assetId, ignoreUndoRedo) {
        for(let params of instancesParams) {
            this.addShape(params, assetId, ignoreUndoRedo);
        }
    }

    addShape(params, assetId, ignoreUndoRedo) {
        let instance = new this._shapeClassMap[assetId](params);
        instance.addToScene(this._scene);
        this._addAsset(instance, ignoreUndoRedo);
        return instance;
    }

    registerShape(shapeClass, assetId, assetName) {
        this._shapeClassMap[assetId] = shapeClass;
        LibraryHandler.loadShape(assetId, assetName);
    }

    getObjects() {
        return this._objects;
    }

    getInstancesForAssetId(assetId) {
        return this.project[assetId] || {};
    }

    deleteAssetInstance(instance, ignoreUndoRedo) {
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                instance.addToScene(this._scene);
                this._addAsset(instance, true);
            }, () => {
                this.deleteAssetInstance(instance, true);
            });
        }
        let assetId = instance.getAssetId();
        let id = instance.getId();
        if(assetId in this.project && id in this.project[assetId]) {
            for(let i = 0; i < this._objects.length; i++) {
                if(instance.getObject() == this._objects[i]) {
                    this._objects.splice(i,1);
                    break;
                }
            }
            delete this.project[assetId][id];
            instance.removeFromScene();
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DELETED, {
                instance: instance,
                undoRedoAction: undoRedoAction,
            });
        }
    }

    _addAsset(instance, ignoreUndoRedo) {
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteAssetInstance(instance, true);
            }, () => {
                instance.addToScene(this._scene);
                this._addAsset(instance, true);
            });
        }
        let assetId = instance.getAssetId();
        let id = instance.getId();
        if(!(assetId in this.project)) this.project[assetId] = {};
        this.project[assetId][id] = instance;

        this._objects.push(instance.getObject());
        PubSub.publish(this._id, PubSubTopics.INSTANCE_ADDED, instance);
    }

    reset() {
        for(let assetId in this.project) {
            let instances = this.project[assetId];
            for(let instanceId in instances) {
                this.deleteAssetInstance(instances[instanceId], true);
            }
        }
        if(!global.disableImmersion) UndoRedoHandler.reset();
        LibraryHandler.reset();
        MaterialsHandler.reset();
        TexturesHandler.reset();
        SettingsHandler.reset();
    }

    exportProject() {
        let projectDetails = this._getProjectDetails();
        let zip = new JSZip();
        zip.file("projectDetails.json", JSON.stringify(projectDetails));
        let library = LibraryHandler.getLibrary();
        for(let assetId in projectDetails['library']) {
            let assetType = projectDetails['library'][assetId]['Type'];
            if(assetType != AssetTypes.PRIMITVE){
                let filename = projectDetails['library'][assetId]['Filepath'];
                zip.file(filename, library[assetId]['Blob']);
            }
        }
        return zip;
    }

    _getProjectDetails() {
        let assets = {};
        for(let assetId in this.project) {
            let instances = this.project[assetId];
            let assetInstances = [];
            for(let instanceId in instances) {
                assetInstances.push(instances[instanceId].exportParams());
            }
            if(assetInstances.length > 0) assets[assetId] = assetInstances;
        }
        let assetIds = Object.keys(assets);
        let settings = SettingsHandler.getSettings();
        let materials = MaterialsHandler.getMaterialsDetails();
        let textures = TexturesHandler.getTexturesDetails();
        for(let side in settings['Skybox']) {
            let assetId = settings['Skybox'][side];
            if(assetId && !assets[assetId]) assetIds.push(assetId);
        }
        let texturesAssetIds = TexturesHandler.getTexturesAssetIds();
        for(let assetId of texturesAssetIds) assetIds.push(assetId);

        let projectDetails = {
            'library': LibraryHandler.getLibraryDetails(assetIds),
            'assets': assets,
            'settings': settings,
            'materials': materials,
            'textures': textures,
        };
        return projectDetails;
    }
}

let projectHandler = new ProjectHandler();
export default projectHandler;
