/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PhongMaterial from '/scripts/core/assets/materials/PhongMaterial.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { COMBINE_MAP, NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import MaterialHelper from '/scripts/core/helpers/editor/MaterialHelper.js';

const { CheckboxField, ColorField, EnumField, NumberField, TextureField, Vector2Field } = MaterialHelper.FieldTypes;

export default class PhongMaterialHelper extends MaterialHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "color", "name": "Color", "type": ColorField },
        { "parameter": "map","name": "Texture Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
        "side",
        "transparent",
        "opacity",
        { "parameter": "alphaMap","name": "Alpha Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
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
        { "parameter": "emissive", "name": "Emissive Color", "type":ColorField},
        { "parameter": "emissiveMap","name": "Emissive Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
        { "parameter": "emissiveIntensity","name": "Emissive Intensity",
            "min": 0, "type": NumberField },
        { "parameter": "envMap","name": "Environment Map",
            "filter": TextureTypes.CUBE, "type": TextureField },
        { "parameter": "combine","name": "Environment-Color Blend",
            "map": COMBINE_MAP, "type": EnumField },
        { "parameter": "reflectivity","name": "Reflectivity",
            "min": 0, "max": 1, "type": NumberField },
        { "parameter": "refractionRatio","name": "Refraction Ratio",
            "min": 0, "max": 1, "type": NumberField },
        { "parameter": "normalMap","name": "Normal Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
        { "parameter": "normalMapType","name": "Normal Type",
            "map": NORMAL_TYPE_MAP, "type": EnumField },
        { "parameter": "normalScale","name": "Normal Scale",
            "min": 0, "max": 1, "type": Vector2Field },
        { "parameter": "shininess", "name": "Shininess", "min": 0,
            "type": NumberField },
        { "parameter": "specular", "name": "Specular Color", "type":ColorField},
        { "parameter": "specularMap","name": "Specular Map",
            "filter": TextureTypes.BASIC, "type": TextureField },
    ];
}

EditorHelperFactory.registerEditorHelper(PhongMaterialHelper, PhongMaterial);
