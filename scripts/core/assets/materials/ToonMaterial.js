/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import ToonMaterialHelper from '/scripts/core/helpers/editor/ToonMaterialHelper.js';
import * as THREE from 'three';

const MAPS = ["map", "alphaMap", "bumpMap", "displacementMap", "emissiveMap", "normalMap"];

export default class ToonMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._alphaMap = params['alphaMap'];
        this._color = numberOr(params['color'], 0x3d9970);
        this._bumpMap = params['bumpMap'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._displacementMap = params['displacementMap'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._emissive = params['emissive'] || 0x000000;
        this._emissiveMap = params['emissiveMap'];
        this._emissiveIntensity = numberOr(params['emissiveIntensity'], 1);
        this._map = params['map'];
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        this._normalScale = params['normalScale'] || [1,1];
        this._wireframe = params['wireframe'] || false;
        this._createMaterial();
    }

    _createEditorHelper() {
        this._editorHelper = new ToonMaterialHelper(this);
    }

    _getDefaultName() {
        return "Toon Material";
    }

    _createMaterial() {
        let materialParams = {
            "bumpScale": this._bumpScale,
            "color": this._color,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "emissive": this._emissive,
            "emissiveIntensity": this._emissiveIntensity,
            "normalMapType": this._normalMapType,
            "normalScale": this._normalScale,
            "opacity": this._opacity,
            "side": this._side,
            "transparent": this._transparent,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshToonMaterial(materialParams);
    }

    getMaps() {
        return MAPS;
    }

    getMaterialType() {
        return MaterialTypes.TOON;
    }

    getSampleTexture() {
        return this._material.map;
    }

    exportParams() {
        let params = super.exportParams();
        params['alphaMap'] = this._alphaMap;
        params['bumpMap'] = this._bumpMap;
        params['bumpScale'] = this._bumpScale;
        params['color'] = this._material.color.getHex();
        params['displacementMap'] = this._displacementMap;
        params['displacementScale'] = this._displacementScale;
        params['displacementBias'] = this._displacementBias;
        params['emissive'] = this._material.emissive.getHex();
        params['emissiveMap'] = this._emissiveMap;
        params['emissiveIntensity'] = this._emissiveIntensity;
        params['map'] = this._map;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        params['normalScale'] = this._normalScale;
        params['wireframe'] = this._wireframe;
        return params;
    }

    getAlphaMap() {
        return this._alphaMap;
    }

    getBumpMap() {
        return this._bumpMap;
    }

    getBumpScale() {
        return this._bumpScale;
    }

    getColor() {
        return this._color;
    }

    getDisplacementBias() {
        return this._displacementBias;
    }

    getDisplacementMap() {
        return this._displacementMap;
    }

    getDisplacementScale() {
        return this._displacementScale;
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

    getMap() {
        return this._map;
    }

    getNormalMap() {
        return this._normalMap;
    }

    getNormalMapType() {
        return this._normalMapType;
    }

    getNormalScale() {
        return this._normalScale;
    }

    getWireframe() {
        return this._wireframe;
    }

    setAlphaMap(alphaMap) {
        if(this._alphaMap == alphaMap) return;
        this._setTexture('alphaMap', alphaMap);
    }

    setBumpMap(bumpMap) {
        if(this._bumpMap == bumpMap) return;
        this._setTexture('bumpMap', bumpMap);
    }

    setBumpScale(bumpScale) {
        if(this._bumpScale == bumpScale) return;
        this._bumpScale = bumpScale;
        this._material.bumpScale = bumpScale;
    }

    setColor(color) {
        if(this._color == color) return;
        this._color = color;
        this._material.color.setHex(color);
    }

    setDisplacementBias(displacementBias) {
        if(this._displacementBias == displacementBias) return;
        this._displacementBias = displacementBias;
        this._material.displacementBias = displacementBias;
    }

    setDisplacementMap(displacementMap) {
        if(this._displacementMap == displacementMap) return;
        this._setTexture('displacementMap', displacementMap);
    }

    setDisplacementScale(displacementScale) {
        if(this._displacementScale == displacementScale) return;
        this._displacementScale = displacementScale;
        this._material.displacementScale = displacementScale;
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

    setMap(map) {
        if(this._map == map) return;
        this._setTexture('map', map);
    }

    setNormalMap(normalMap) {
        if(this._normalMap == normalMap) return;
        this._setTexture('normalMap', normalMap);
    }

    setNormalMapType(normalMapType) {
        if(this._normalMapType == normalMapType) return;
        this._normalMapType = normalMapType;
        this._material.normalMapType = normalMapType;
        this._material.needsUpdate = true;
    }

    setNormalScale(normalScale) {
        if(this._normalScale == normalScale) return;
        this._normalScale = normalScale;
        this._material.normalScale = normalScale;
    }

    setWireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }
}

MaterialsHandler.registerMaterial(ToonMaterial, MaterialTypes.TOON);
