/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { NORMAL_TYPE_MAP, REVERSE_NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "parameter": "color", "name": "Color", "type": ColorInput },
    { "parameter": "map","name": "Texture Map", 
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "side" },
    { "parameter": "transparent" },
    { "parameter": "opacity" },
    { "parameter": "alphaMap","name": "Alpha Map", 
        "filter": TextureTypes.BASIC, "type": TextureInput },
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
    { "parameter": "normalMap","name": "Normal Map", 
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "parameter": "normalMapType","name": "Normal Type", 
        "options": [ "Tangent", "Object" ], "map": NORMAL_TYPE_MAP,
        "reverseMap": REVERSE_NORMAL_TYPE_MAP, "type": EnumInput },
    //{ "parameter": "normalScale","name": "Normal Scale", 
    //    "min": 0, "max": 1, "type": Vector2Input },
];

const MAPS = ["map", "alphaMap", "bumpMap", "displacementMap", "emissiveMap", "normalMap"];

export default class ToonMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._color = new THREE.Color(numberOr(params['color'], 0x3d9970));
        this._wireframe = params['wireframe'] || false;
        this._map = params['map'];
        this._alphaMap = params['alphaMap'];
        this._bumpMap = params['bumpMap'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._displacementMap = params['displacementMap'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._emissive = new THREE.Color(params['emissive'] || 0x000000);
        this._emissiveMap = params['emissiveMap'];
        this._emissiveIntensity = numberOr(params['emissiveIntensity'], 1);
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        //this._normalScale = params['normalScale'] || [1,1];
        this._createMaterial();
    }

    _getDefaultName() {
        return "Toon Material";
    }

    _createMaterial() {
        let materialParams = {
            "transparent": this._transparent,
            "side": this._side,
            "opacity": this._opacity,
            "color": this._color,
            "wireframe": this._wireframe,
            "bumpScale": this._bumpScale,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "emissive": this._emissive,
            "emissiveIntensity": this._emissiveIntensity,
            "normalMapType": this._normalMapType,
            //"normalScale": this._normalScale,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshToonMaterial(materialParams);
    }

    _getMaps() {
        return MAPS;
    }

    getMaterialType() {
        return MaterialTypes.TOON;
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
        params['bumpMap'] = this._bumpMap;
        params['bumpScale'] = this._bumpScale;
        params['displacementMap'] = this._displacementMap;
        params['displacementScale'] = this._displacementScale;
        params['displacementBias'] = this._displacementBias;
        params['emissive'] = this._material.emissive.getHex();
        params['emissiveMap'] = this._emissiveMap;
        params['emissiveIntensity'] = this._emissiveIntensity;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        //params['normalScale'] = this._normalScale;
        return params;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) continue;
            let menuField = this._createMenuField(field);
            if(menuField) menuFieldsMap[field.parameter] = menuField;
        }
        return menuFieldsMap;
    }
}
