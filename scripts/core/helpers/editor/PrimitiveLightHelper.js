/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import AssetHelper from '/scripts/core/helpers/editor/AssetHelper.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "intensity", "name": "Intensity", "min": 0,
        "type": NumberInput },
    { "parameter": "color", "name": "Color", "type": ColorInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveLightHelper extends AssetHelper {
    constructor(asset) {
        super(asset);
        this._createMesh();
    }

    _createMesh() {
        console.error(
            "PrimitiveLightHelper._createMesh() should be overridden");
        return;
    }

    updateVisualEdit(isVisualEdit) {
        if(isVisualEdit) {
            this._object.add(this._mesh);
        } else {
            this._object.remove(this._mesh);
            fullDispose(this._mesh);
        }
        super.updateVisualEdit(isVisualEdit);
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
