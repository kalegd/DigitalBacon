/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/assetTypes/AssetsHandler.js';

class MaterialsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.MATERIAL_ADDED, PubSubTopics.MATERIAL_DELETED,
            AssetTypes.MATERIAL);
    }

    addAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.addAsset(asset, ignoreUndoRedo, ignorePublish);
        if(asset.editorHelper) asset.editorHelper.undoDispose();
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
        asset.dispose();
        if(asset.editorHelper) asset.editorHelper.dispose();
    }
}

let materialsHandler = new MaterialsHandler();
export default materialsHandler;
