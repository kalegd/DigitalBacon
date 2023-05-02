/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import System from '/scripts/core/assets/systems/System.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';

const FIELDS = [
    { "parameter": "disabled", "name": "Disabled", "type": CheckboxInput },
];

export default class SystemHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.SYSTEM_UPDATED);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) {
                continue;
            } else {
                let input = this._createStandardInput(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }
}

EditorHelperFactory.registerEditorHelper(SystemHelper, System);
