/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Scene from '/scripts/core/assets/Scene.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4, capitalizeFirstLetter, storeStringValuesInSet } from '/scripts/core/helpers/utils.module.js';

/* global JSZip, JSZipUtils */

class ProjectHandler {
    constructor() {
        this._id = uuidv4();
        this._scene = Scene.getObject();
        this._objects = [];
        this._assets = {};
        this._assetHandlers = {};
        this._sessionAssets = {};
        this._sessionAssets[Scene.getId()] = Scene;
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
                let projectDetailsCopy;
                try {
                    //this._projectDetails needs to be immutable hence the copy
                    this._projectDetails = JSON.parse(projectDetailsString);
                    projectDetailsCopy = JSON.parse(projectDetailsString);
                } catch(error) {
                    this._handleLoadingError(errorCallback);
                    return;
                }
                LibraryHandler.load(projectDetailsCopy['library'], jsZip,()=>{
                    global.loadingLocks.delete(lock);
                    SettingsHandler.load(this._projectDetails['settings']);
                    try {
                        for(let key in this._assetHandlers) {
                            this._assetHandlers[key].deleteFromDiff(
                                this._projectDetails[key.toLowerCase() + 's']);
                        }
                        this._loadAssets(projectDetailsCopy, true);
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
                let assetIds = Object.keys(this._projectDetails.library);
                assetIds.push(...Object.keys(projectDetails.library));
                assetIds = new Set(assetIds);
                LibraryHandler.filterAssets(assetIds);
                LibraryHandler.load(projectDetails['library'], jsZip,()=>{
                    try {
                        for(let key in this._assetHandlers) {
                            this._assetHandlers[key].deleteFromDiff(
                                projectDetails[key.toLowerCase() + 's']);
                        }
                        this._loadAssets(projectDetails, true);
                    } catch(error) {
                        console.error(error);
                        if(errorCallback) errorCallback();
                        return;
                    }
                    if(successCallback) successCallback();
                }, () => { if(errorCallback) errorCallback(); });
            }, () => { if(errorCallback) errorCallback(); });
    }

    _createDependencyGraph(projectDetails) {
        let pendingAssets = {};
        for(let key in this._assetHandlers) {
            let handler = this._assetHandlers[key];
            key = key.toLowerCase() + 's';
            if(!handler) {
                console.error('Unexpected asset type: ' + key);
                continue;
            }
            for(let assetId in projectDetails[key]) {
                for(let params of projectDetails[key][assetId]) {
                    pendingAssets[params.id] = {
                        params: params,
                        removedParams: {},
                        handler: handler,
                        loaded: false,
                        dependsOn: new Set(),
                        dependedOnBy: new Set(),
                    };
                }
            }
        }
        for(let key in this._assetHandlers) {
            key = key.toLowerCase() + 's';
            for(let assetId in projectDetails[key]) {
                for(let params of projectDetails[key][assetId]) {
                    this._addDependencies(pendingAssets, params);
                }
            }
        }
        return pendingAssets;
    }

    _addDependencies(pendingAssets, params) {
        for(let key in params) {
            if(key == 'id') continue;
            let value = params[key];
            if(Array.isArray(value)) {
                for(let id of value) {
                    if(id in pendingAssets && !this._sessionAssets[id]) {
                        pendingAssets[params.id].dependsOn.add(id);
                        pendingAssets[id].dependedOnBy.add(params.id);
                    }
                }
            } else if(typeof value == 'string') {
                if(value in pendingAssets && !this._sessionAssets[value]) {
                    pendingAssets[params.id].dependsOn.add(value);
                    pendingAssets[value].dependedOnBy.add(params.id);
                }
            }
        }
    }

    _loadAssets(projectDetails, isDiff) {
        let pendingAssets = this._createDependencyGraph(projectDetails);
        let assetsPendingUpdates = {};
        while(Object.keys(pendingAssets).length > 0) {
            let loadedSomething = false;
            let maxDependedOnBy = 0;
            let maxDependedOnByAssetId;
            for(let id in pendingAssets) {
                if(pendingAssets[id].dependedOnBy.size > maxDependedOnBy)
                    maxDependedOnByAssetId = id;
                if(pendingAssets[id].dependsOn.size != 0) continue;
                pendingAssets[id].handler.loadAsset(pendingAssets[id].params,
                    isDiff);
                for(let dependencyId of pendingAssets[id].dependedOnBy) {
                    pendingAssets[dependencyId].dependsOn.delete(id);
                }
                delete pendingAssets[id];
                loadedSomething = true;
            }
            if(!loadedSomething) {
                let pendingAsset = pendingAssets[maxDependedOnByAssetId];
                this._loadAssetWithoutDependencies(pendingAsset, isDiff);
                for(let dependencyId of pendingAsset.dependedOnBy) {
                    pendingAssets[dependencyId].dependsOn
                        .delete(maxDependedOnByAssetId);
                }
                assetsPendingUpdates[maxDependedOnByAssetId] = pendingAsset;
                delete pendingAssets[maxDependedOnByAssetId];
            }
        }
        for(let id in assetsPendingUpdates) {
            let removedParams = assetsPendingUpdates[id].removedParams;
            let asset = assetsPendingUpdates[id].asset;
            for(let key in removedParams) {
                let value = removedParams[key];
                if(Array.isArray(value))
                    value = assetsPendingUpdates[id].params[key].concat(value);
                if(key == 'parentId')
                    asset.addTo(this._sessionAssets[value], true);
                asset['set' + capitalizeFirstLetter(key)](value);
            }
        }
    }

    _loadAssetWithoutDependencies(pendingAsset, isDiff) {
        let params = pendingAsset.params;
        let removedParams = pendingAsset.removedParams;
        for(let dependencyId of pendingAsset.dependsOn) {
            for(let key in params) {
                if(key == 'id') continue;
                let value = params[key];
                if(value === dependencyId) {
                    removedParams[key] = params[key];
                    delete params[key];
                } else if(Array.isArray(value) && value.includes(dependencyId)){
                    if(!removedParams[key]) removedParams[key] = [];
                    removedParams[key].push(dependencyId);
                    params[key] = value.filter((v) => v != dependencyId);
                }
            }
        }
        pendingAsset.asset = pendingAsset.handler.loadAsset(params, isDiff);
    }

    getAssetHandler(assetType) {
        return this._assetHandlers[assetType];
    }

    registerAsset(assetClass) {
        this._assetHandlers[assetClass.assetType].registerAsset(assetClass);
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

    getAsset(id) {
        return this._assets[id];
    }

    getAssets() {
        return this._assets;
    }

    getAssetsForType(assetType) {
        return this._assetHandlers[assetType].getAssets();
    }

    getAssetClassesForType(assetType) {
        return this._assetHandlers[assetType].getAssetClasses();
    }

    getSessionAsset(id) {
        return this._sessionAssets[id];
    }

    deleteAsset(asset, ignorePublish, ignoreUndoRedo) {
        let assetType = LibraryHandler.getType(asset.getAssetId());
        let handler = this._assetHandlers[assetType];
        handler.deleteAsset(asset, ignorePublish, ignoreUndoRedo);
    }

    deleteAssetFromHandler(asset) {
        let id = asset.getId();
        if(this._assets[id]) {
            if(asset.getObject) {
                let object = asset.getObject();
                for(let i = 0; i < this._objects.length; i++) {
                    if(object == this._objects[i]) {
                        this._objects.splice(i,1);
                        break;
                    }
                }
                let type = LibraryHandler.getType(asset.getAssetId());
                if(asset.parent && asset.parent != Scene
                        && type != AssetTypes.INTERNAL) {
                    let parentAssetId = asset.parent.getAssetId();
                    let parentType = LibraryHandler.getType(parentAssetId);
                    if(parentType == AssetTypes.INTERNAL)
                        this._scene.attach(object);
                }
            }
            if(asset.onRemoveFromProject) asset.onRemoveFromProject();
            delete this._assets[id];
        }
    }

    addNewAsset(assetId, params, ignorePublish, ignoreUndoRedo) {
        let assetType = LibraryHandler.getType(assetId);
        let handler = this._assetHandlers[assetType];
        return handler.addNewAsset(assetId, params, ignorePublish,
            ignoreUndoRedo);
    }

    addAsset(asset, ignorePublish, ignoreUndoRedo) {
        let assetType = LibraryHandler.getType(asset.getAssetId());
        let handler = this._assetHandlers[assetType];
        handler.addAsset(asset, ignorePublish, ignoreUndoRedo);
    }

    addAssetFromHandler(asset) {
        let id = asset.getId();
        if(asset.onAddToProject) asset.onAddToProject();
        if(asset.getObject) {
            if(asset.parent) asset.parent.getObject().add(asset.getObject());
            this._objects.push(asset.getObject());
        }
        if(this._assets[id]) return; //Prevent multi-user collisions
                                              //caused by undo/redo
        this._assets[id] = asset;
        this._sessionAssets[id] = asset;
    }

    reset() {
        this._sessionAssets = {};
        this._sessionAssets[Scene.getId()] = Scene;
        if(!global.disableImmersion) UndoRedoHandler.reset();
        for(let type in this._assetHandlers) {
            this._assetHandlers[type].reset();
        }
        LibraryHandler.reset();
        SettingsHandler.reset();
    }

    exportDiff() {
        let oldValues = new Set();
        let projectDetails = this._getProjectDetails();
        storeStringValuesInSet(this._projectDetails, oldValues);
        for(let assetId in projectDetails.library) {
            if(oldValues.has(assetId)) delete projectDetails.library[assetId];
        }
        return this._exportBlob(projectDetails);
    }

    exportProject(includeInternals) {
        let projectDetails = this._getProjectDetails(!includeInternals);
        return this._exportBlob(projectDetails);
    }

    _exportBlob(projectDetails) {
        let zip = new JSZip();
        zip.file("projectDetails.json", JSON.stringify(projectDetails));
        let library = LibraryHandler.getLibrary();
        for(let assetId in projectDetails['library']) {
            let assetType = projectDetails['library'][assetId]['Type'];
            let isExternal = library[assetId]['IsExternal'];
            if(assetType != AssetTypes.INTERNAL && !isExternal) {
                let filename = projectDetails['library'][assetId]['Filepath'];
                zip.file(filename, library[assetId]['Blob']);
            }
        }
        return zip;
    }

    _getProjectDetails(skipInternals) {
        let assetIds = Object.keys(LibraryHandler.library);
        let settings = SettingsHandler.getSettings();
        let projectDetails = { settings: settings, version: global.version };
        let values = new Set();
        if(skipInternals)
            PubSub.publish(this._id, PubSubTopics.SANITIZE_INTERNALS,null,true);
        for(let type in this._assetHandlers) {
            if(skipInternals && type == AssetTypes.INTERNAL) continue;
            let handler = this._assetHandlers[type];
            let details = handler.getAssetsDetails();
            if(!details) continue;
            projectDetails[type.toLowerCase() + 's'] = details;
        }

        storeStringValuesInSet(projectDetails, values);
        assetIds.filter((assetId) => values.has(assetId));
        projectDetails['library'] = LibraryHandler.getLibraryDetails(
            assetIds);
        return projectDetails;
    }
}

let projectHandler = new ProjectHandler();
export default projectHandler;
