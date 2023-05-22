/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';

export default class Component extends Asset {
    constructor(params = {}) {
        super(params);
    }

    supports(asset) {
        return true;
    }

    static assetType = AssetTypes.COMPONENT;
}
