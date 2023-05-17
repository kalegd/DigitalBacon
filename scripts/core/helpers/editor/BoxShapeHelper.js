/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BoxShape from '/scripts/core/assets/primitives/BoxShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "width", "name": "Width", "min": 0, "type": NumberInput },
    { "parameter": "height", "name": "Height", "min": 0, "type": NumberInput },
    { "parameter": "depth", "name": "Depth", "min": 0, "type": NumberInput },
    { "parameter": "widthSegments", "name": "Width Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "depthSegments", "name": "Depth Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class BoxShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
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

EditorHelperFactory.registerEditorHelper(BoxShapeHelper, BoxShape);
