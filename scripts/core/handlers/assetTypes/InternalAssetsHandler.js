/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/assetTypes/AssetsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';

class InternalAssetsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.INTERNAL_ADDED,
            PubSubTopics.INTERNAL_DELETED, AssetTypes.INTERNAL);
    }

    addAsset(asset, ignorePublish) {
        if(this._assets[asset.getId()]) return;
        this._assets[asset.getId()] = asset;
        this._sessionAssets[asset.getId()] = asset;
        ProjectHandler.addAssetFromHandler(asset);
        if(ignorePublish) return;
        let topic = this._addedTopic + ':' + asset.getAssetId();
        PubSub.publish(this._id, topic, asset, true);
    }

    deleteAsset(asset, ignorePublish) {
        if(!(asset.getId() in this._assets)) return;
        delete this._assets[asset.getId()];
        ProjectHandler.deleteAssetFromHandler(asset);
        if(ignorePublish) return;
        let topic = this._deletedTopic + ':' + asset.getAssetId() + ':'
            + asset.getId();
        PubSub.publish(this._id, topic, { asset: asset }, true);
    }

    deleteFromDiff() {}

    loadAsset(params) {
        if(!(params.assetId in this._assetClassMap)) {
            console.error("Unrecognized asset found");
        } else if(this._assets[params.id]) {
            this._assets[params.id].updateFromParams(params);
            return this._assets[params.id];
        } else if(this._sessionAssets[params.id]) {
            this.addAsset(this._sessionAssets[params.id], true, true);
            return this._assets[params.id];
        } else {
            return this.addNewAsset(params.assetId, params, true, true);
        }
    }

    //load(assets) {
    //    if(!assets) return;
    //    for(let assetTypeId in assets) {
    //        if(!(assetTypeId in this._assetClassMap)) {
    //            console.error("Unrecognized asset found");
    //            continue;
    //        }
    //        for(let params of assets[assetTypeId]) {
    //            if(this._assets[params.id]) {
    //                this._assets[params.id].updateFromParams(params);
    //            } else if(this._sessionAssets[params.id]) {
    //                this.addAsset(this._sessionAssets[params.id], true, true);
    //            } else {
    //                this.addNewAsset(assetTypeId, params, true, true);
    //            }
    //        }
    //    }
    //}

    reset() {
        for(let assetId in this._assets) {
            let asset = this._assets[assetId];
            this.deleteAsset(asset, true, true);
            this.addAsset(asset, true, true);
        }
    }
}

let internalAssetsHandler = new InternalAssetsHandler();
export default internalAssetsHandler;
