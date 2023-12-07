/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ModelAsset from '/scripts/core/assets/ModelAsset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/assetTypes/AssetsHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';

class ModelsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.MODEL_ADDED, PubSubTopics.MODEL_DELETED,
            AssetTypes.MODEL);
    }

    addNewAsset(assetId, params, ignorePublish, ignoreUndoRedo) {
        let asset = new ModelAsset(params || { assetId: assetId });
        this.addAsset(asset, ignorePublish, ignoreUndoRedo);
        return asset;
    }

    loadAsset(params, isDiff) {
        if(!(params.assetId in LibraryHandler.library)) {
            console.error("Unrecognized asset found");
        } else if(isDiff && this._assets[params.id]) {
            this._assets[params.id].updateFromParams(params);
            return this._assets[params.id];
        } else {
            return this.addNewAsset(params.assetId, params, true, true);
        }
    }
}

let modelsHandler = new ModelsHandler();
export default modelsHandler;
