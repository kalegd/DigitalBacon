/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MaterialHelper from '/scripts/core/helpers/editor/MaterialHelper.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { NORMAL_TYPE_MAP, REVERSE_NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import Vector2Input from '/scripts/core/menu/input/Vector2Input.js';

const FIELDS = [
    { "parameter": "color", "name": "Color", "type": ColorInput },
    { "parameter": "map","name": "Texture Map", 
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "side" },
    { "parameter": "transparent" },
    { "parameter": "opacity" },
    { "parameter": "alphaMap","name": "Alpha Map", 
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "flatShading","name": "Flat Shading",
        "type": CheckboxInput },
    { "parameter": "wireframe", "name": "Wireframe", "type": CheckboxInput },
    { "parameter": "bumpMap","name": "Bump Map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "bumpScale","name": "Bump Scale",
        "min": 0, "max": 1, "type": NumberInput },
    { "parameter": "displacementMap","name": "Displacement Map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "displacementScale","name": "Displacement Scale",
        "type": NumberInput },
    { "parameter": "displacementBias","name": "Displacement Bias",
        "type": NumberInput },
    { "parameter": "emissive", "name": "Emissive Color", "type": ColorInput },
    { "parameter": "emissiveMap","name": "Emissive Map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "emissiveIntensity","name": "Emissive Intensity",
        "min": 0, "type": NumberInput },
    { "parameter": "envMap","name": "Environment Map",
        "filter": TextureTypes.CUBE, "type": TextureInput },
    { "parameter": "envMapIntensity","name": "Environment Intensity",
        "min": 0, "type": NumberInput },
    { "parameter": "metalness","name": "Metalness",
        "min": 0, "max": 1, "type": NumberInput },
    { "parameter": "metalnessMap","name": "Metalness Map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "normalMap","name": "Normal Map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "normalMapType","name": "Normal Type",
        "options": [ "Tangent", "Object" ], "map": NORMAL_TYPE_MAP,
        "reverseMap": REVERSE_NORMAL_TYPE_MAP, "type": EnumInput },
    { "parameter": "normalScale","name": "Normal Scale",
        "min": 0, "max": 1, "type": Vector2Input },
    { "parameter": "roughness","name": "Roughness",
        "min": 0, "max": 1, "type": NumberInput },
    { "parameter": "roughnessMap","name": "Roughness Map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
];

export default class StandardMaterialHelper extends MaterialHelper {
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
