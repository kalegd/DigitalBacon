/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

export default class AssetsHandler {
    constructor(addedTopic, deletedTopic, detailsName) {
        this._id = uuidv4();
        this._assets = {};
        this._assetClassMap = {};
        this._sessionAssets = {};
        this._addedTopic = addedTopic;
        this._deletedTopic = deletedTopic;
        ProjectHandler.registerAssetHandler(this, detailsName);
    }

    addNewAsset(assetId, params, ignorePublish, ignoreUndoRedo) {
        let asset = new this._assetClassMap[assetId](params);
        this.addAsset(asset, ignorePublish, ignoreUndoRedo);
        return asset;
    }

    addAsset(asset, ignorePublish, ignoreUndoRedo) {
        if(this._assets[asset.getId()]) return;
        this._assets[asset.getId()] = asset;
        this._sessionAssets[asset.getId()] = asset;
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(asset);
        if(asset.update) global.dynamicAssets.add(asset);
        ProjectHandler.addAssetFromHandler(asset);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteAsset(asset, ignorePublish, true);
            }, () => {
                this.addAsset(asset, ignorePublish, true);
            });
        }
        if(ignorePublish) return;
        let topic = this._addedTopic + ':' + asset.getAssetId();
        PubSub.publish(this._id, topic, asset, true);
    }

    deleteAsset(asset, ignorePublish, ignoreUndoRedo) {
        if(!(asset.getId() in this._assets)) return;
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this.addAsset(asset, ignorePublish, true);
            }, () => {
                this.deleteAsset(asset, ignorePublish, true);
            });
        }
        delete this._assets[asset.getId()];
        ProjectHandler.deleteAssetFromHandler(asset);
        if(asset.update) global.dynamicAssets.delete(asset);
        if(ignorePublish) return;
        let topic = this._deletedTopic + ':' + asset.getAssetId();
        PubSub.publish(this._id, topic, {
            asset: asset,
            undoRedoAction: undoRedoAction,
        }, true);
    }

    deleteFromDiff(assets) {
        let assetsToDelete = [];
        for(let id in this._assets) {
            let asset = this._assets[id];
            let assetId = asset.getAssetId();
            if(!(assetId in assets) || !assets[assetId].some(p=>p.id==id))
                assetsToDelete.push(asset);
        }
        for(let asset of assetsToDelete) {
            this.deleteAsset(asset, true, true);
        }
    }

    loadAsset(params, isDiff) {
        if(!(params.assetId in this._assetClassMap)) {
            console.error("Unrecognized asset found");
        } else if(isDiff && this._assets[params.id]) {
            this._assets[params.id].updateFromParams(params);
            return this._assets[params.id];
        } else {
            return this.addNewAsset(params.assetId, params, true, true);
        }
    }

    //load(assets, isDiff) {
    //    if(!assets) return;
    //    if(isDiff) {
    //        let assetsToDelete = [];
    //        for(let id in this._assets) {
    //            let asset = this._assets[id];
    //            let assetId = asset.getAssetId();
    //            if(!(assetId in assets) || !assets[assetId].some(p=>p.id==id))
    //                assetsToDelete.push(asset);
    //        }
    //        for(let asset of assetsToDelete) {
    //            this.deleteAsset(asset, true, true);
    //        }
    //    }
    //    for(let assetTypeId in assets) {
    //        if(!(assetTypeId in this._assetClassMap)) {
    //            console.error("Unrecognized asset found");
    //            continue;
    //        }
    //        for(let params of assets[assetTypeId]) {
    //            if(isDiff && this._assets[params.id]) {
    //                this._assets[params.id].updateFromParams(params);
    //            } else {
    //                this.addNewAsset(assetTypeId, params, true, true);
    //            }
    //        }
    //    }
    //}

    registerAsset(assetClass) {
        if(this._assetClassMap[assetClass.assetId]) {
            //Hot swapping of existing assets. Probably won't do it. Too hard...
        }
        this._assetClassMap[assetClass.assetId] = assetClass;
    }

    getAssets() {
        return this._assets;
    }

    getAsset(id) {
        return this._assets[id];
    }

    getAssetClass(assetId) {
        return this._assetClassMap[assetId];
    }

    getAssetClasses() {
        return Object.values(this._assetClassMap);
    }

    getSessionAsset(id) {
        return this._sessionAssets[id];
    }

    reset() {
        for(let assetId in this._assets) {
            this.deleteAsset(this._assets[assetId], true, true);
        }
        this._assets = {};
        this._sessionAssets = {};
        let library = LibraryHandler.library;
        for(let assetId in this._assetClassMap) {
            if(!library[assetId] || library[assetId]['Blob']) {
                delete this._assetClassMap[assetId];
            }
        }
    }

    getAssetsDetails() {
        let assetsDetails = {};
        for(let id in this._assets) {
            let asset = this._assets[id];
            let assetId = asset.getAssetId();
            let params = asset.exportParams();
            if(!(assetId in assetsDetails)) assetsDetails[assetId] = [];
            assetsDetails[assetId].push(params);
        }
        return assetsDetails;
    }
}
