/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ModelAsset from '/scripts/core/assets/ModelAsset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

export default class ModelAssetHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.MODEL_UPDATED);
    }

    static fields = [
        "visualEdit",
        "parentId",
        "position",
        "rotation",
        "scale",
        "renderOrder",
    ];
}

EditorHelperFactory.registerEditorHelper(ModelAssetHelper, ModelAsset);
