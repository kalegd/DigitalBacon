/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Asset from '/scripts/core/assets/Asset.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class Component extends Asset {
    constructor(params = {}) {
        super(params);
    }


    isSupported(asset) {
        return true;
    }
}
