/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/AssetsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';

const SHOULD_HAVE_REFACTORED_SOONER = {
    BASIC: '95f63d4b-06d1-4211-912b-556b6ce7bf5f',
    CUBE: '8f95c544-ff6a-42d3-b1e7-03a1e772b3b2',
};

class TexturesHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.TEXTURE_ADDED, PubSubTopics.TEXTURE_DELETED);
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
        asset.dispose();
    }

    load(assets, isDiff) {
        if(assets) this._handleOldVersion(assets);
        super.load(assets, isDiff);
    }

    _handleOldVersion(assets) {
        let usingOldVersion = false;
        for(let type in SHOULD_HAVE_REFACTORED_SOONER) {
            if(type in assets) {
                let id = SHOULD_HAVE_REFACTORED_SOONER[type];
                assets[id] = assets[type];
                delete assets[type];
                usingOldVersion = true;
            }
        }
        if(usingOldVersion) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: "The project's version is outdated and won't be supported starting in July. Please save a new copy of it",
            });
        }
    }

    getTextureType(textureId) {
        return this._textures[textureId].getTextureType();
    }

    getTexturesAssetIds() {
        let assetIds = new Set();
        for(let textureId in this._textures) {
            let texture = this._textures[textureId];
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
