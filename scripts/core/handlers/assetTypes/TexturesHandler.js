/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/assetTypes/AssetsHandler.js';

class TexturesHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.TEXTURE_ADDED, PubSubTopics.TEXTURE_DELETED,
            AssetTypes.TEXTURE);
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
        asset.dispose();
    }

    getTextureType(id) {
        return this._assets[id].getTextureType();
    }

    getTexturesAssetIds() {
        let assetIds = new Set();
        for(let id in this._assets) {
            let texture = this._assets[id];
            let textureAssetIds = texture.getAssetIds();
            for(let assetId of textureAssetIds) {
                assetIds.add(assetId);
            }
        }
        return assetIds;
    }
}

let texturesHandler = new TexturesHandler();
export default texturesHandler;
