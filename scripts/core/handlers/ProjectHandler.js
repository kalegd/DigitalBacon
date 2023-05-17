/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

//TODO: Delete this when we handle the debacle TODO in loadZip() + loadDiffZip()
const orderedHandlerKeys = [AssetTypes.LIGHT, AssetTypes.SYSTEM, AssetTypes.COMPONENT, AssetTypes.TEXTURE, AssetTypes.MATERIAL, AssetTypes.IMAGE, AssetTypes.MODEL, AssetTypes.SHAPE];
  
class ProjectHandler {
    constructor() {
        this._assetHandlers = {};
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
                try {
                    this._projectDetails = JSON.parse(projectDetailsString);
                } catch(error) {
                    this._handleLoadingError(errorCallback);
                    return;
                }
                LibraryHandler.load(this._projectDetails['library'], jsZip,()=>{
                    global.loadingLocks.delete(lock);
                    SettingsHandler.load(this._projectDetails['settings']);
                    //TODO: Delete in July
                    let assets = this._projectDetails['assets'];
                    if(assets) {
                        for(let assetId in assets) {
                            let assetType = LibraryHandler.getType(assetId);
                            assetType = assetType.toLowerCase() + 's';
                            if(!(assetType in this._projectDetails))
                                this._projectDetails[assetType] = {};
                            this._projectDetails[assetType][assetId]
                                = assets[assetId];
                        }
                        PubSub.publish(this._id,PubSubTopics.MENU_NOTIFICATION,{
                            text: "The project's version is outdated and won't be supported starting in July. Please save a new copy of it",
                        });
                    }
                    //TODO: Loop through this._assetHandlers. Not doing it now
                    //      because order is semi-important. Eventually it
                    //      shouldn't matter as there's the potential for
                    //      components to depend on models and circular
                    //      dependencies as well which we'll need to handle
                    try {
                        for(let key of orderedHandlerKeys) {
                            this._assetHandlers[key].load(
                                this._projectDetails[key.toLowerCase() + 's']);
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

    loadDiffZip(jsZip, successCallback, errorCallback) {
        jsZip.file("projectDetails.json").async("string").then(
            (projectDetailsString) => {
                let projectDetails;
                try {
                    projectDetails = JSON.parse(projectDetailsString);
                } catch(error) {
                    console.error(error);
                    if(errorCallback) errorCallback();
                    return;
                }
                LibraryHandler.load(projectDetails['library'], jsZip,()=>{
                    //TODO: Loop through this._assetHandlers. Not doing it now
                    //      because order is semi-important. Eventually it
                    //      shouldn't matter as there's the potential for
                    //      components to depend on models and circular
                    //      dependencies as well which we'll need to handle
                    try {
                        for(let key of orderedHandlerKeys) {
                            this._assetHandlers[key].load(
                                projectDetails[key.toLowerCase() + 's'], true);
                        }
                    } catch(error) {
                        console.error(error);
                        if(errorCallback) errorCallback();
                        return;
                    }
                    if(successCallback) successCallback();
                }, () => { if(errorCallback) errorCallback(); });
            }, () => { if(errorCallback) errorCallback(); });
    }

    getAssetHandler(assetType) {
        return this._assetHandlers[assetType];
    }

    registerAssetHandler(assetHandler, assetType) {
        this._assetHandlers[assetType] = assetHandler;
    }

    _handleLoadingError(errorCallback) {
        PubSub.publish(this._id, PubSubTopics.PROJECT_LOADING, true);
        if(errorCallback) errorCallback();
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

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        let assetType = LibraryHandler.getType(asset.getAssetId());
        let handler = this._assetHandlers[assetType];
        handler.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
    }

    deleteAssetInstance(instance, ignorePublish) {
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
        }
    }

    addNewAsset(assetId, params, ignoreUndoRedo, ignorePublish) {
        let assetType = LibraryHandler.getType(assetId);
        let handler = this._assetHandlers[assetType];
        return handler.addNewAsset(assetId, params, ignoreUndoRedo,
            ignorePublish);
    }

    addAsset(instance, ignorePublish) {
        instance.addToScene(this._scene);
        let assetId = instance.getAssetId();
        let id = instance.getId();
        if(!(assetId in this.project)) this.project[assetId] = {};
        if(this.project[assetId][id]) return; //Prevent multi-user collisions
                                              //caused by undo/redo
        this.project[assetId][id] = instance;
        this._objects.push(instance.getObject());
        this._sessionInstances[id] = instance;
    }

    reset() {
        this._sessionInstances = {};
        //for(let assetId in this.project) {
        //    let instances = this.project[assetId];
        //    for(let instanceId in instances) {
        //        this.deleteAssetInstance(instances[instanceId], true, true);
        //    }
        //}
        if(!global.disableImmersion) UndoRedoHandler.reset();
        for(let type in this._assetHandlers) {
            this._assetHandlers[type].reset();
        }
        LibraryHandler.reset();
        SettingsHandler.reset();
    }

    exportDiff() {
        let assetIds = [];
        let projectDetails = this._getProjectDetails(true);
        for(let key of orderedHandlerKeys) {
            key = key.toLowerCase() + 's';
            for(let assetId in projectDetails[key]) {
                if(!(assetId in this._projectDetails[key])) {
                    assetIds.push(assetId);
                }
            }
        }
        projectDetails['library'] = LibraryHandler.getLibraryDetails(assetIds);
        return this._exportBlob(projectDetails);
    }

    exportProject() {
        let projectDetails = this._getProjectDetails();
        return this._exportBlob(projectDetails);
    }

    _exportBlob(projectDetails) {
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

    _getProjectDetails(skipLibrary) {
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
        let projectDetails = { settings: settings, version: global.version };
        for(let type in this._assetHandlers) {
            let handler = this._assetHandlers[type];
            let details = handler.getAssetsDetails();
            projectDetails[type.toLowerCase() + 's'] = details;
            if(type == AssetTypes.TEXTURE) {
                let texturesAssetIds = handler.getTexturesAssetIds();
                for(let assetId of texturesAssetIds) assetIds.push(assetId);
            } else if (type == AssetTypes.COMPONENT) {
                for(let assetId in details) assetIds.push(assetId);
            }
        }
        for(let side in settings['Skybox']) {
            let assetId = settings['Skybox'][side];
            if(assetId && !assets[assetId]) assetIds.push(assetId);
        }

        if(!skipLibrary) {
            projectDetails['library'] = LibraryHandler.getLibraryDetails(
                assetIds);
        }
        return projectDetails;
    }
}

let projectHandler = new ProjectHandler();
export default projectHandler;
