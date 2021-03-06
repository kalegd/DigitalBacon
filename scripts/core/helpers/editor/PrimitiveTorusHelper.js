/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMeshHelper from '/scripts/core/helpers/editor/PrimitiveMeshHelper.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "radius", "name": "Radius", "min": 0,
        "type": NumberInput },
    { "parameter": "tube", "name": "Tube Radius", "min": 0,
        "type": NumberInput },
    { "parameter": "radialSegments", "name": "Radial Sides", "min": 2,
        "type": NumberInput },
    { "parameter": "tubularSegments", "name": "Tubular Sides", "min": 3,
        "type": NumberInput },
    { "parameter": "arc", "name": "Degrees", "min": 0, "max": 360,
        "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveTorusHelper extends PrimitiveMeshHelper {
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
