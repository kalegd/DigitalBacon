/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const MAPS = ["map", "alphaMap", "envMap"];

export default class BasicMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = BasicMaterial.assetId;
        super(params);
        this._alphaMap = params['alphaMap'];
        this._color = numberOr(params['color'], 0x3d9970);
        this._combine = params['combine'] || THREE.MultiplyOperation;
        this._envMap = params['envMap'];
        this._map = params['map'];
        this._reflectivity = numberOr(params['reflectivity'], 1);
        this._refractionRatio = numberOr(params['refractionRatio'],0.98);
        this._wireframe = params['wireframe'] || false;
        this._createMaterial();
    }

    _getDefaultName() {
        return BasicMaterial.assetName;
    }

    _createMaterial() {
        let materialParams = {
            "color": this._color,
            "combine": this._combine,
            "reflectivity": this._reflectivity,
            "refractionRatio": this._refractionRatio,
            "side": this._side,
            "transparent": this._transparent,
            "opacity": this._opacity,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshBasicMaterial(materialParams);
    }

    getMaps() {
        return MAPS;
    }

    getSampleTexture() {
        return this._material.map;
    }

    exportParams() {
        let params = super.exportParams();
        params['alphaMap'] = this._alphaMap;
        params['color'] = this._color;
        params['combine'] = this._combine;
        params['envMap'] = this._envMap;
        params['map'] = this._map;
        params['reflectivity'] = this._reflectivity;
        params['refractionRatio'] = this._refractionRatio;
        params['wireframe'] = this._wireframe;
        return params;
    }

    getAlphaMap() {
        return this._alphaMap;
    }

    getColor() {
        return this._color;
    }

    getCombine() {
        return this._combine;
    }

    getEnvMap() {
        return this._envMap;
    }

    getMap() {
        return this._map;
    }

    getReflectivity() {
        return this._reflectivity;
    }

    getRefractionRatio() {
        return this._refractionRatio;
    }

    getWireframe() {
        return this._wireframe;
    }

    setAlphaMap(alphaMap) {
        if(this._alphaMap == alphaMap) return;
        this._setTexture('alphaMap', alphaMap);
    }

    setColor(color) {
        if(this._color == color) return;
        this._color = color;
        this._material.color.setHex(color);
    }

    setCombine(combine) {
        if(this._combine == combine) return;
        this._combine = combine;
        this._material.combine = combine;
        this._material.needsUpdate = true;
    }

    setEnvMap(envMap) {
        if(this._envMap == envMap) return;
        this._setTexture('envMap', envMap);
    }

    setMap(map) {
        if(this._map == map) return;
        this._setTexture('map', map);
    }

    setReflectivity(reflectivity) {
        if(this._reflectivity == reflectivity) return;
        this._reflectivity = reflectivity;
        this._material.reflectivity = reflectivity;
    }

    setRefractionRatio(refractionRatio) {
        if(this._refractionRatio == refractionRatio) return;
        this._refractionRatio = refractionRatio;
        this._material.refractionRatio = refractionRatio;
    }

    setWireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }

    static assetId = '943b7a57-7e8f-4717-9bc6-0ba2637d9e3b';
    static assetName = 'Basic Material';
}

MaterialsHandler.registerAsset(BasicMaterial);
