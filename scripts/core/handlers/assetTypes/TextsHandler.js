/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/assetTypes/AssetsHandler.js';

class TextsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.TEXT_ADDED, PubSubTopics.TEXT_DELETED,
            AssetTypes.TEXT);
    }
}

let textsHandler = new TextsHandler();
export default textsHandler;
