/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Colors } from '/scripts/core/helpers/constants.js';
import AssetHelper from '/scripts/core/helpers/editor/AssetHelper.js';
import * as THREE from 'three';

const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class GLTFAssetHelper extends AssetHelper {
    constructor(asset) {
        super(asset);
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }
}
