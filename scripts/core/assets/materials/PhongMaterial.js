/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { COMBINE_MAP, REVERSE_COMBINE_MAP, NORMAL_TYPE_MAP, REVERSE_NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
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
    { "name": "Flat Shading", "parameter": "flatShading",
        "type": CheckboxInput },
    { "name": "Wireframe", "parameter": "wireframe", "type": CheckboxInput },
    { "name": "Bump Map", "parameter": "bumpMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Bump Scale", "parameter": "bumpScale",
        "min": 0, "max": 1, "type": NumberInput },
    { "name": "Displacement Map", "parameter": "displacementMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Displacement Scale", "parameter": "displacementScale",
        "type": NumberInput },
    { "name": "Displacement Bias", "parameter": "displacementBias",
        "type": NumberInput },
    { "name": "Emissive Color", "parameter": "emissive", "type": ColorInput },
    { "name": "Emissive Map", "parameter": "emissiveMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Emissive Intensity", "parameter": "emissiveIntensity",
        "min": 0, "type": NumberInput },
    { "name": "Environment Map", "parameter": "envMap",
        "filter": TextureTypes.CUBE, "type": TextureInput },
    { "name": "Environment-Color Blend", "parameter": "combine",
        "options": [ "Multiply", "Mix", "Add" ], "map": COMBINE_MAP,
        "reverseMap": REVERSE_COMBINE_MAP, "type": EnumInput },
    { "name": "Reflectivity", "parameter": "reflectivity",
        "min": 0, "max": 1, "type": NumberInput },
    { "name": "Refraction Ratio", "parameter": "refractionRatio",
        "min": 0, "max": 1, "type": NumberInput },
    { "name": "Normal Map", "parameter": "normalMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Normal Type", "parameter": "normalMapType",
        "options": [ "Tangent", "Object" ], "map": NORMAL_TYPE_MAP,
        "reverseMap": REVERSE_NORMAL_TYPE_MAP, "type": EnumInput },
    //{ "name": "Normal Scale", "parameter": "normalScale",
    //    "min": 0, "max": 1, "type": Vector2Input },
    { "name": "Shininess", "parameter": "shininess", "min": 0,
        "type": NumberInput },
    { "name": "Specular Color", "parameter": "specular", "type": ColorInput },
    { "name": "Specular Map", "parameter": "specularMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
];

const MAPS = ["map", "alphaMap", "bumpMap", "displacementMap", "emissiveMap", "envMap", "normalMap", "specularMap"];

export default class PhongMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._color = new THREE.Color(params['color'] || 0x3d9970);
        this._wireframe = params['wireframe'] || false;
        this._flatShading = params['flatShading'] || false;
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
        this._envMap = params['envMap'];
        this._combine = params['combine']
            || THREE.MultiplyOperation;
        this._reflectivity = numberOr(params['reflectivity'], 1);
        this._refractionRatio = numberOr(params['refractionRatio'],0.98);
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        //this._normalScale = params['normalScale'] || [1,1];
        this._shininess = numberOr(params['shininess'], 30);
        this._specular = new THREE.Color(params['specular'] || 0x111111);
        this._specularMap = params['specularMap'];
        this._createMaterial();
    }

    _getDefaultName() {
        return "Phong Material";
    }

    _createMaterial() {
        let materialParams = {
            "transparent": this._transparent,
            "side": this._side,
            "opacity": this._opacity,
            "color": this._color,
            "wireframe": this._wireframe,
            "flatShading": this._flatShading,
            "bumpScale": this._bumpScale,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "emissive": this._emissive,
            "emissiveIntensity": this._emissiveIntensity,
            "combine": this._combine,
            "reflectivity": this._reflectivity,
            "refractionRatio": this._refractionRatio,
            "normalMapType": this._normalMapType,
            //"normalScale": this._normalScale,
            "shininess": this._shininess,
            "specular": this._specular,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshPhongMaterial(materialParams);
    }

    _getMaps() {
        return MAPS;
    }

    getMaterialType() {
        return MaterialTypes.PHONG;
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
        params['flatShading'] = this._flatShading;
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
        params['envMap'] = this._envMap;
        params['combine'] = this._combine;
        params['reflectivity'] = this._reflectivity;
        params['refractionRatio'] = this._refractionRatio;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        //params['normalScale'] = this._normalScale;
        params['shininess'] = this._shininess;
        params['specular'] = this._material.specular.getHex();
        params['specularMap'] = this._specularMap;
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
