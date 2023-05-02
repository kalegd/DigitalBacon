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
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
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
        this._sessionInstances = {};
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
        PubSub.publish(this._id, PubSubTopics.PROJECT_LOADING, false, true);
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
                                this._addImages(instances, true, true);
                            } else if(type == AssetTypes.MODEL) {
                                this._addGLTFs(instances, true, true);
                            } else if(type == AssetTypes.LIGHT) {
                                this._addLights(instances, assetId, true, true);
                            } else if(type == AssetTypes.SHAPE) {
                                this._addShapes(instances, assetId, true, true);
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

    addInstance(params, ignoreUndoRedo, ignorePublish) {
        let assetId = params.assetId;
        let type = LibraryHandler.getType(assetId);
        let instance;
        if(type == AssetTypes.IMAGE) {
            instance = this.addImage(params, ignoreUndoRedo, ignorePublish);
        } else if(type == AssetTypes.MODEL) {
            instance = this.addGLTF(params, ignoreUndoRedo, ignorePublish);
        } else if(type == AssetTypes.LIGHT) {
            instance = this.addLight(params, assetId, ignoreUndoRedo,
                                        ignorePublish);
        } else if(type == AssetTypes.SHAPE) {
            instance = this.addShape(params, assetId, ignoreUndoRedo,
                                        ignorePublish);
        }
        return instance;
    }

    _addImages(instancesParams, ignoreUndoRedo, ignorePublish) {
        for(let params of instancesParams) {
            this.addImage(params, ignoreUndoRedo, ignorePublish);
        }
    }

    addImage(params, ignoreUndoRedo, ignorePublish) {
        let image = new ClampedTexturePlane(params);
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(image);
        image.addToScene(this._scene);
        this.addAsset(image, ignoreUndoRedo, ignorePublish);
        return image;
    }

    _addGLTFs(instancesParams, ignoreUndoRedo, ignorePublish) {
        for(let params of instancesParams) {
            this.addGLTF(params, ignoreUndoRedo, ignorePublish);
        }
    }

    addGLTF(params, ignoreUndoRedo, ignorePublish) {
        let gltf = new GLTFAsset(params);
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(gltf);
        gltf.addToScene(this._scene);
        this.addAsset(gltf, ignoreUndoRedo, ignorePublish);
        return gltf;
    }

    _addLights(instancesParams, assetId, ignoreUndoRedo, ignorePublish) {
        for(let params of instancesParams) {
            this.addLight(params, assetId, ignoreUndoRedo, ignorePublish);
        }
    }

    addLight(params, assetId, ignoreUndoRedo, ignorePublish) {
        let instance = new this._lightClassMap[assetId](params);
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(instance);
        instance.addToScene(this._scene);
        this.addAsset(instance, ignoreUndoRedo, ignorePublish);
        return instance;
    }

    registerLight(lightClass, assetId, assetName) {
        this._lightClassMap[assetId] = lightClass;
        LibraryHandler.loadLight(assetId, assetName);
    }

    _addShapes(instancesParams, assetId, ignoreUndoRedo, ignorePublish) {
        for(let params of instancesParams) {
            this.addShape(params, assetId, ignoreUndoRedo, ignorePublish);
        }
    }

    addShape(params, assetId, ignoreUndoRedo, ignorePublish) {
        let instance = new this._shapeClassMap[assetId](params);
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(instance);
        instance.addToScene(this._scene);
        this.addAsset(instance, ignoreUndoRedo, ignorePublish);
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

    getSessionInstance(id) {
        return this._sessionInstances[id];
    }

    deleteAssetInstance(instance, ignoreUndoRedo, ignorePublish) {
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                instance.addToScene(this._scene);
                this.addAsset(instance, true);
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
            if(instance.getObject().parent != this._scene) {
                this._scene.attach(instance.getObject());
            }
            delete this.project[assetId][id];
            instance.removeFromScene();
            if(ignorePublish) return;
            let topic = PubSubTopics.INSTANCE_DELETED + ":" + instance.getId();
            PubSub.publish(this._id, topic, {
                instance: instance,
                undoRedoAction: undoRedoAction,
            });
        }
    }

    addAsset(instance, ignoreUndoRedo, ignorePublish) {
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteAssetInstance(instance, true, ignorePublish);
            }, () => {
                instance.addToScene(this._scene);
                this.addAsset(instance, true, ignorePublish);
            });
        }
        let assetId = instance.getAssetId();
        let id = instance.getId();
        if(!(assetId in this.project)) this.project[assetId] = {};
        if(this.project[assetId][id]) return; //Prevent multi-user collisions
                                              //caused by undo/redo
        this.project[assetId][id] = instance;
        this._objects.push(instance.getObject());
        this._sessionInstances[id] = instance;

        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ADDED, instance);
    }

    reset() {
        this._sessionInstances = {};
        for(let assetId in this.project) {
            let instances = this.project[assetId];
            for(let instanceId in instances) {
                this.deleteAssetInstance(instances[instanceId], true, true);
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
