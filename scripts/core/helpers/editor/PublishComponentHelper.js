/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PublishComponent from '/scripts/core/assets/components/PublishComponent.js';
import ComponentHelper from '/scripts/core/helpers/editor/ComponentHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

const { EnumField, TextField } = ComponentHelper.FieldTypes;
const interactableEvents = {
    None: 'none',
    Click: 'click',
    Drag: 'drag',
    Down: 'down',
    Up: 'up',
    Move: 'move',
    Over: 'over',
    Out: 'out',
};
const touchInteractableEvents = {
    None: 'none',
    Click: 'click',
    Drag: 'drag',
    Down: 'down',
    Up: 'up',
};

export default class PublishComponentHelper extends ComponentHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "topic", "name": "Event", "singleLine": true,
            "type": TextField },
        { "parameter": "pointerEvent", "name": "Pointer Action",
            "map": interactableEvents, "type": EnumField },
        { "parameter": "gripEvent", "name": "Grip Action",
            "map": interactableEvents, "type": EnumField },
        { "parameter": "touchEvent", "name": "Touch Action",
            "map": touchInteractableEvents, "type": EnumField },
    ];
}

EditorHelperFactory.registerEditorHelper(PublishComponentHelper, PublishComponent);
