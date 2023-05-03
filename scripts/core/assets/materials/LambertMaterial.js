/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Material, MaterialsHandler, utils } from 'digitalbacon';
import * as THREE from 'three';

const MAPS = ["map", "alphaMap", "emissiveMap", "envMap"];
let numberOr = utils.numberOr;

export default class LambertMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._assetId = LambertMaterial.assetId;
        this._alphaMap = params['alphaMap'];
        this._color = numberOr(params['color'], 0x3d9970);
        this._combine = params['combine'] || THREE.MultiplyOperation;
        this._emissive = params['emissive'] || 0x000000;
        this._emissiveIntensity = numberOr(params['emissiveIntensity'], 1);
        this._emissiveMap = params['emissiveMap'];
        this._envMap = params['envMap'];
        this._map = params['map'];
        this._reflectivity = numberOr(params['reflectivity'], 1);
        this._refractionRatio = numberOr(params['refractionRatio'], 0.98);
        this._wireframe = params['wireframe'] || false;
        this._createMaterial();
    }

    _getDefaultName() {
        return LambertMaterial.assetName;
    }

    _createMaterial() {
        let materialParams = {
            "color": this._color,
            "combine": this._combine,
            "emissive": this._emissive,
            "emissiveIntensity": this._emissiveIntensity,
            "opacity": this._opacity,
            "reflectivity": this._reflectivity,
            "refractionRatio": this._refractionRatio,
            "side": this._side,
            "transparent": this._transparent,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshLambertMaterial(materialParams);
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
        params['emissive'] = this._emissive;
        params['emissiveIntensity'] = this._emissiveIntensity;
        params['emissiveMap'] = this._emissiveMap;
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

    getEmissive() {
        return this._emissive;
    }

    getEmissiveIntensity() {
        return this._emissiveIntensity;
    }

    getEmissiveMap() {
        return this._emissiveMap;
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

    setEmissive(emissive) {
        if(this._emissive == emissive) return;
        this._emissive = emissive;
        this._material.emissive.setHex(emissive);
    }

    setEmissiveIntensity(emissiveIntensity) {
        if(this._emissiveIntensity == emissiveIntensity) return;
        this._emissiveIntensity = emissiveIntensity;
        this._material.emissiveIntensity = emissiveIntensity;
    }

    setEmissiveMap(emissiveMap) {
        if(this._emissiveMap == emissiveMap) return;
        this._setTexture('emissiveMap', emissiveMap);
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

    static assetId = '5169a83b-1e75-4cb1-8c33-c049726d97e4';
    static assetName = 'Lambert Material';
}

MaterialsHandler.registerMaterial(LambertMaterial);
