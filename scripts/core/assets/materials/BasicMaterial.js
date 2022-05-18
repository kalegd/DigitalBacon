/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { COMBINE_MAP, REVERSE_COMBINE_MAP } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "name": "Color", "parameter": "color", "type": ColorInput },
    { "name": "Texture Map", "parameter": "map",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Display" },
    { "name": "Transparent" },
    { "name": "Opacity" },
    { "name": "Alpha Map", "parameter": "alphaMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Wireframe", "parameter": "wireframe", "type": CheckboxInput },
    { "name": "Environment Map", "parameter": "envMap",
        "filter": TextureTypes.CUBE, "type": TextureInput },
    { "name": "Color & Environment Blend", "parameter": "combine",
        "options": [ "Multiply", "Mix", "Add" ], "map": COMBINE_MAP,
        "reverseMap": REVERSE_COMBINE_MAP, "type": EnumInput },
    { "name": "Reflectivity", "parameter": "reflectivity",
        "min": 0, "max": 1, "type": NumberInput },
    { "name": "Refraction Ratio", "parameter": "refractionRatio",
        "min": 0, "max": 1, "type": NumberInput },
];

const MAPS = ["map", "alphaMap", "envMap"];

export default class BasicMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._color = new THREE.Color(params['color'] || 0x3d9970);
        this._wireframe = params['wireframe'] || false;
        this._map = params['map'];
        this._alphaMap = params['alphaMap'];
        this._envMap = params['envMap'];
        this._combine = params['combine']
            || THREE.MultiplyOperation;
        this._reflectivity = numberOr(params['reflectivity'], 1);
        this._refractionRatio = numberOr(params['refractionRatio'],0.98);
        this._createMaterial();
    }

    _getDefaultName() {
        return "Basic Material";
    }

    _createMaterial() {
        let materialParams = {
            "transparent": this._transparent,
            "side": this._side,
            "opacity": this._opacity,
            "color": this._color,
            "wireframe": this._wireframe,
            "combine": this._combine,
            "reflectivity": this._reflectivity,
            "refractionRatio": this._refractionRatio,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshBasicMaterial(materialParams);
    }

    _getMaps() {
        return MAPS;
    }

    getMaterialType() {
        return MaterialTypes.BASIC;
    }

    getSampleTexture() {
        return this._material.map;
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    exportParams() {
        let params = super.exportParams();
        params['color'] = this._material.color.getHex();
        params['wireframe'] = this._wireframe;
        params['map'] = this._map;
        params['alphaMap'] = this._alphaMap;
        params['envMap'] = this._envMap;
        params['combine'] = this._combine;
        params['reflectivity'] = this._reflectivity;
        params['refractionRatio'] = this._refractionRatio;
        return params;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.name in menuFieldsMap) continue;
            let menuField = this._createMenuField(field);
            if(menuField) menuFieldsMap[field.name] = menuField;
        }
        return menuFieldsMap;
    }
}
