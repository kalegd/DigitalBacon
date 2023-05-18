/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import NormalMaterial from '/scripts/core/assets/materials/NormalMaterial.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { NORMAL_TYPE_MAP, REVERSE_NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
import MaterialHelper from '/scripts/core/helpers/editor/MaterialHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import Vector2Input from '/scripts/core/menu/input/Vector2Input.js';

export default class NormalMaterialHelper extends MaterialHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "side" },
        { "parameter": "transparent" },
        { "parameter": "opacity" },
        { "parameter": "flatShading","name": "Flat Shading",
            "type": CheckboxInput },
        { "parameter": "wireframe", "name": "Wireframe", "type": CheckboxInput},
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
        { "parameter": "normalMap","name": "Normal Map",
            "filter": TextureTypes.BASIC, "type": TextureInput },
        { "parameter": "normalMapType","name": "Normal Type",
            "options": [ "Tangent", "Object" ], "map": NORMAL_TYPE_MAP,
            "reverseMap": REVERSE_NORMAL_TYPE_MAP, "type": EnumInput },
        { "parameter": "normalScale","name": "Normal Scale",
            "min": 0, "max": 1, "type": Vector2Input },
    ];
}

EditorHelperFactory.registerEditorHelper(NormalMaterialHelper, NormalMaterial);
