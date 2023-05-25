/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/assetTypes/AssetsHandler.js';

class LightsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.LIGHT_ADDED, PubSubTopics.LIGHT_DELETED,
            AssetTypes.LIGHT);
    }
}

let lightsHandler = new LightsHandler();
export default lightsHandler;
