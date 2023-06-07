/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';

export default class CustomAssetEntity extends AssetEntity {
    constructor(params = {}) {
        super(params);
    }

    static assetType = AssetTypes.CUSTOM_ASSET;
}
