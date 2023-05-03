/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import System from '/scripts/core/assets/systems/System.js';
import SystemsHandler from '/scripts/core/handlers/SystemsHandler.js';

export default class GrabbableSystem extends System {
    constructor(params = {}) {
        super(params);
        this._assetId = GrabbableSystem.assetId;
    }

    _getDefaultName() {
        return GrabbableSystem.assetName;
    }

    getDescription() {
        return 'Enables assets to be picked up by the user';
    }

    static assetId = '6329e98a-4311-4457-9198-48d75640f8cc';
    static assetName = 'Grabbable System';
}

SystemsHandler.registerSystem(GrabbableSystem);
