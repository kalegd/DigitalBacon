/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import CustomAssetEntity from '/scripts/core/assets/CustomAssetEntity.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

export default class CustomAssetEntityHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.CUSTOM_ASSET_UPDATED);
    }
}

EditorHelperFactory.registerEditorHelper(CustomAssetEntityHelper, CustomAssetEntity);
