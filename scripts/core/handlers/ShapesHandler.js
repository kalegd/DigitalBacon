/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/AssetsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';

class ShapesHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.SHAPE_ADDED, PubSubTopics.SHAPE_DELETED,
            AssetTypes.SHAPE);
    }

    addAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.addAsset(asset, ignoreUndoRedo, ignorePublish);
        ProjectHandler.addAsset(asset, ignorePublish);
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
        ProjectHandler.deleteAssetInstance(asset, ignorePublish);
    }
}

let shapesHandler = new ShapesHandler();
export default shapesHandler;
