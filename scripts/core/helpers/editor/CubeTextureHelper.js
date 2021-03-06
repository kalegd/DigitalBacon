/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { MAPPING_MAP, REVERSE_MAPPING_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import CubeImageInput from '/scripts/core/menu/input/CubeImageInput.js';

const FIELDS = [
    { "parameter": "images", "name": "Images", "type": CubeImageInput },
    { "parameter": "mapping", "name": "Mapping", "type": EnumInput,
        "options": [ "Reflection", "Refraction" ], "map": MAPPING_MAP,
        "reverseMap": REVERSE_MAPPING_MAP },
];

export default class CubeTextureHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.TEXTURE_UPDATED);
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
