/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ClampedTexturePlane from '/scripts/core/assets/ClampedTexturePlane.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/AssetsHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';

class ImagesHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.IMAGE_ADDED, PubSubTopics.IMAGE_DELETED,
            AssetTypes.IMAGE);
    }

    addNewAsset(assetId, params, ignoreUndoRedo, ignorePublish) {
        let asset = new ClampedTexturePlane(params || { assetId: assetId });
        this.addAsset(asset, ignoreUndoRedo, ignorePublish);
        return asset;
    }

    addAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.addAsset(asset, ignoreUndoRedo, ignorePublish);
        ProjectHandler.addAsset(asset, ignorePublish);
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
        ProjectHandler.deleteAssetInstance(asset, ignorePublish);
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
            if(!(assetTypeId in LibraryHandler.library)) {
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
}

let imagesHandler = new ImagesHandler();
export default imagesHandler;
