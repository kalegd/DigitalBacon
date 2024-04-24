/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const MAPS = ["map", "alphaMap", "emissiveMap", "envMap"];

export default class LambertMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = LambertMaterial.assetId;
        super(params);
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

    get alphaMap() { return this._alphaMap; }
    get color() { return this._color; }
    get combine() { return this._combine; }
    get emissive() { return this._emissive; }
    get emissiveIntensity() { return this._emissiveIntensity; }
    get emissiveMap() { return this._emissiveMap; }
    get envMap() { return this._envMap; }
    get map() { return this._map; }
    get reflectivity() { return this._reflectivity; }
    get refractionRatio() { return this._refractionRatio; }
    get wireframe() { return this._wireframe; }

    set alphaMap(alphaMap) {
        if(this._alphaMap == alphaMap) return;
        this._setTexture('alphaMap', alphaMap);
    }

    set color(color) {
        if(this._color == color) return;
        this._color = color;
        this._material.color.setHex(color);
    }

    set combine(combine) {
        if(this._combine == combine) return;
        this._combine = combine;
        this._material.combine = combine;
        this._material.needsUpdate = true;
    }

    set emissive(emissive) {
        if(this._emissive == emissive) return;
        this._emissive = emissive;
        this._material.emissive.setHex(emissive);
    }

    set emissiveIntensity(emissiveIntensity) {
        if(this._emissiveIntensity == emissiveIntensity) return;
        this._emissiveIntensity = emissiveIntensity;
        this._material.emissiveIntensity = emissiveIntensity;
    }

    set emissiveMap(emissiveMap) {
        if(this._emissiveMap == emissiveMap) return;
        this._setTexture('emissiveMap', emissiveMap);
    }

    set envMap(envMap) {
        if(this._envMap == envMap) return;
        this._setTexture('envMap', envMap);
    }

    set map(map) {
        if(this._map == map) return;
        this._setTexture('map', map);
    }

    set reflectivity(reflectivity) {
        if(this._reflectivity == reflectivity) return;
        this._reflectivity = reflectivity;
        this._material.reflectivity = reflectivity;
    }

    set refractionRatio(refractionRatio) {
        if(this._refractionRatio == refractionRatio) return;
        this._refractionRatio = refractionRatio;
        this._material.refractionRatio = refractionRatio;
    }

    set wireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }

    static assetId = '5169a83b-1e75-4cb1-8c33-c049726d97e4';
    static assetName = 'Lambert Material';
}

ProjectHandler.registerAsset(LambertMaterial);
LibraryHandler.loadBuiltIn(LambertMaterial);
