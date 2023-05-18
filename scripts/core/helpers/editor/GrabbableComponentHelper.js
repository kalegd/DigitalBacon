/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import GrabbableComponent from '/scripts/core/assets/components/GrabbableComponent.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';

export default class GrabbableComponentHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.COMPONENT_UPDATED);
    }

    static fields = [
        { "parameter": "stealable", "name": "Stealable", "type": CheckboxInput},
    ];
}

EditorHelperFactory.registerEditorHelper(GrabbableComponentHelper, GrabbableComponent);
