/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import * as THREE from 'three';

export default class AssetsHandler {
    constructor(addedTopic, deletedTopic) {
        this._id = uuidv4();
        this._assets = {};
        this._assetClassMap = {};
        this._sessionAssets = {};
        this._addedTopic = addedTopic;
        this._deletedTopic = deletedTopic;
    }

    addNewAsset(assetId, params, ignoreUndoRedo, ignorePublish) {
        let asset = new this._assetClassMap[assetId](params);
        this.addAsset(asset, ignoreUndoRedo, ignorePublish);
        return asset;
    }

    addAsset(asset, ignoreUndoRedo, ignorePublish) {
        if(this._assets[asset.getId()]) return;
        this._assets[asset.getId()] = asset;
        this._sessionAssets[asset.getId()] = asset;
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(asset);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteAsset(asset, true, ignorePublish);
            }, () => {
                this.addAsset(asset, true, ignorePublish);
            });
        }
        if(!ignorePublish)
            PubSub.publish(this._id, this._addedTopic, asset);
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        if(!(asset.getId() in this._assets)) return;
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this.addAsset(asset, true, ignorePublish);
            }, () => {
                this.deleteAsset(asset, true, ignorePublish);
            });
        }
        delete this._assets[asset.getId()];
        if(ignorePublish) return;
        PubSub.publish(this._id, this._deletedTopic, {
            asset: asset,
            undoRedoAction: undoRedoAction,
        });
    }

    load(assets, isDiff) {
        if(!assets) return;
        if(isDiff) {
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
        for(let assetTypeId in assets) {
            if(!(assetTypeId in this._assetClassMap)) {
                console.error("Unrecognized asset found");
                continue;
            }
            for(let params of assets[assetTypeId]) {
                if(isDiff && this._assets[params.id]) {
                    this._assets[params.id].updateFromParams(params);
                } else {
                    this.addNewAsset(assetTypeId, params, true, true);
                }
            }
        }
    }

    registerAsset(assetClass) {
        this._assetClassMap[assetClass.assetId] = assetClass;
    }

    getAssets() {
        return this._assets;
    }

    getAsset(id) {
        return this._assets[id];
    }

    getAssetClasses() {
        return Object.values(this._assetClassMap);
    }

    getSessionAsset(id) {
        return this._sessionAssets[id];
    }

    reset() {
        this._assets = {};
        this._sessionAssets = {};
    }

    getAssetsAssetIds() {
        let assetIds = new Set();
        //TODO: Fetch assetIds of each asset
        return assetIds;
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