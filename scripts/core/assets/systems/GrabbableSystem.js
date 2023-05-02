/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import System from '/scripts/core/assets/systems/System.js';
import SystemsHandler from '/scripts/core/handlers/SystemsHandler.js';

const NAME = 'Grabbable';
const SYSTEM_TYPE_ID = '6329e98a-4311-4457-9198-48d75640f8cc';

export default class GrabbableSystem extends System {
    constructor(params = {}) {
        super(params);
        this._systemTypeId = SYSTEM_TYPE_ID;
    }

    _getDefaultName() {
        return NAME;
    }

    getDescription() {
        return 'Enables assets to be picked up by the user';
    }

    static getSystemTypeId() {
        return SYSTEM_TYPE_ID;
    }

    static getName() {
        return NAME;
    }
}

SystemsHandler.registerSystem(GrabbableSystem, SYSTEM_TYPE_ID);
