/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BasicMaterial from '/scripts/core/assets/materials/BasicMaterial.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { COMBINE_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import MaterialHelper from '/scripts/core/helpers/editor/MaterialHelper.js';

const { CheckboxField, ColorField, EnumField, NumberField, TextureField } = MaterialHelper.FieldTypes;

export default class BasicMaterialHelper extends MaterialHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "color", "name": "Color", "type": ColorField },
        { "parameter": "mapId","name": "Texture Map",
            "filter": [TextureTypes.BASIC], "type": TextureField },
        "side",
        "transparent",
        "opacity",
        { "parameter": "alphaMapId","name": "Alpha Map",
            "filter": [TextureTypes.BASIC], "type": TextureField },
        { "parameter": "wireframe", "name": "Wireframe", "type": CheckboxField},
        { "parameter": "envMapId","name": "Environment Map",
            "filter": [TextureTypes.CUBE], "type": TextureField },
        { "parameter": "combine","name": "Color & Environment Blend",
            "map": COMBINE_MAP, "type": EnumField },
        { "parameter": "reflectivity","name": "Reflectivity",
            "min": 0, "max": 1, "type": NumberField },
        { "parameter": "refractionRatio","name": "Refraction Ratio",
            "min": 0, "max": 1, "type": NumberField },
    ];
}

EditorHelperFactory.registerEditorHelper(BasicMaterialHelper, BasicMaterial);
