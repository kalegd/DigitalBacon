/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { PointerInteractable } from '/scripts/DigitalBacon-UI.js';

class OrbitDisablingPointerInteractable extends PointerInteractable {
    constructor(object) {
        super(object);
    }

    addSelectedBy(owner) {
        super.addSelectedBy(owner);
        SessionHandler.disableOrbit();
    }

    removeSelectedBy(owner) {
        super.removeSelectedBy(owner);
        SessionHandler.enableOrbit();
    }
}

export default OrbitDisablingPointerInteractable;
