/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/AssetsHandler.js';

class SystemsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.SYSTEM_ADDED, PubSubTopics.SYSTEM_DELETED);
    }
}

let systemsHandler = new SystemsHandler();
export default systemsHandler;
