/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import GrabbableSystem from '/scripts/core/assets/systems/GrabbableSystem.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import SystemHelper from '/scripts/core/helpers/editor/SystemHelper.js';

export default class GrabbableSystemHelper extends SystemHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "disabled" },
    ];
}

EditorHelperFactory.registerEditorHelper(GrabbableSystemHelper, GrabbableSystem);
