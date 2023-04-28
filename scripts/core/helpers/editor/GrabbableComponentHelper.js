/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';

const FIELDS = [
    { "parameter": "stealable", "name": "Stealable", "type": CheckboxInput },
];

export default class GrabbableComponentHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.COMPONENT_UPDATED);
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
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
