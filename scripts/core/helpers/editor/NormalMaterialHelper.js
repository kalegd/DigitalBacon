/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import NormalMaterial from '/scripts/core/assets/materials/NormalMaterial.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
import MaterialHelper from '/scripts/core/helpers/editor/MaterialHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxField from '/scripts/core/menu/input/CheckboxField.js';
import EnumField from '/scripts/core/menu/input/EnumField.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import TextureField from '/scripts/core/menu/input/TextureField.js';
import Vector2Field from '/scripts/core/menu/input/Vector2Field.js';

export default class NormalMaterialHelper extends MaterialHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "side" },
        { "parameter": "transparent" },
        { "parameter": "opacity" },
        { "parameter": "flatShading","name": "Flat Shading",
            "type": CheckboxField },
        { "parameter": "wireframe", "name": "Wireframe", "type": CheckboxField},
        { "parameter": "bumpMap","name": "Bump Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
        { "parameter": "bumpScale","name": "Bump Scale",
            "min": 0, "max": 1, "type": NumberField },
        { "parameter": "displacementMap","name": "Displacement Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
        { "parameter": "displacementScale","name": "Displacement Scale",
            "type": NumberField },
        { "parameter": "displacementBias","name": "Displacement Bias",
            "type": NumberField },
        { "parameter": "normalMap","name": "Normal Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
        { "parameter": "normalMapType","name": "Normal Type",
            "map": NORMAL_TYPE_MAP, "type": EnumField },
        { "parameter": "normalScale","name": "Normal Scale",
            "min": 0, "max": 1, "type": Vector2Field },
    ];
}

EditorHelperFactory.registerEditorHelper(NormalMaterialHelper, NormalMaterial);
