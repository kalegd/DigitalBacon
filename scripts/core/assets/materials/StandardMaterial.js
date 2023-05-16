/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const MAPS = ["map", "alphaMap", "bumpMap", "displacementMap", "emissiveMap", "envMap", "metalnessMap", "normalMap", "roughnessMap"];

export default class StandardMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = StandardMaterial.assetId;
        super(params);
        this._color = numberOr(params['color'], 0x3d9970);
        this._alphaMap = params['alphaMap'];
        this._bumpMap = params['bumpMap'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._displacementMap = params['displacementMap'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._emissive = params['emissive'] || 0x000000;
        this._emissiveMap = params['emissiveMap'];
        this._emissiveIntensity = numberOr(params['emissiveIntensity'], 1);
        this._envMap = params['envMap'];
        this._envMapIntensity = numberOr(params['envMapIntensity'], 1);
        this._flatShading = params['flatShading'] || false;
        this._map = params['map'];
        this._metalness = numberOr(params['metalness'], 0);
        this._metalnessMap = params['metalnessMap'];
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        this._normalScale = params['normalScale'] || [1,1];
        this._roughness = numberOr(params['roughness'], 1);
        this._roughnessMap = params['roughnessMap'];
        this._wireframe = params['wireframe'] || false;
        this._createMaterial();
    }

    _getDefaultName() {
        return StandardMaterial.assetName;
    }

    _createMaterial() {
        let materialParams = {
            "color": this._color,
            "bumpScale": this._bumpScale,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "emissive": this._emissive,
            "emissiveIntensity": this._emissiveIntensity,
            "envMapIntensity": this._envMapIntensity,
            "flatShading": this._flatShading,
            "metalness": this._metalness,
            "normalMapType": this._normalMapType,
            "normalScale": this._normalScale,
            "opacity": this._opacity,
            "side": this._side,
            "transparent": this._transparent,
            "roughness": this._roughness,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshStandardMaterial(materialParams);
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
        params['bumpMap'] = this._bumpMap;
        params['bumpScale'] = this._bumpScale;
        params['color'] = this._material.color.getHex();
        params['displacementMap'] = this._displacementMap;
        params['displacementScale'] = this._displacementScale;
        params['displacementBias'] = this._displacementBias;
        params['emissive'] = this._material.emissive.getHex();
        params['emissiveMap'] = this._emissiveMap;
        params['emissiveIntensity'] = this._emissiveIntensity;
        params['envMap'] = this._envMap;
        params['envMapIntensity'] = this._envMapIntensity;
        params['flatShading'] = this._flatShading;
        params['map'] = this._map;
        params['metalness'] = this._metalness;
        params['metalnessMap'] = this._metalnessMap;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        params['normalScale'] = this._normalScale;
        params['roughness'] = this._roughness;
        params['roughnessMap'] = this._roughnessMap;
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

    getEnvMap() {
        return this._envMap;
    }

    getEnvMapIntensity() {
        return this._envMapIntensity;
    }

    getFlatShading() {
        return this._flatShading;
    }

    getMap() {
        return this._map;
    }

    getMetalness() {
        return this._metalness;
    }

    getMetalnessMap() {
        return this._metalnessMap;
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

    getRoughness() {
        return this._roughness;
    }

    getRoughnessMap() {
        return this._roughnessMap;
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

    setEnvMap(envMap) {
        if(this._envMap == envMap) return;
        this._setTexture('envMap', envMap);
    }

    setEnvMapIntensity(envMapIntensity) {
        if(this._envMapIntensity == envMapIntensity) return;
        this._envMapIntensity = envMapIntensity;
        this._material.envMapIntensity = envMapIntensity;
    }

    setFlatShading(flatShading) {
        if(this._flatShading == flatShading) return;
        this._flatShading = flatShading;
        this._material.flatShading = flatShading;
        this._material.needsUpdate = true;
    }

    setMap(map) {
        if(this._map == map) return;
        this._setTexture('map', map);
    }

    setMetalness(metalness) {
        if(this._metalness == metalness) return;
        this._metalness = metalness;
        this._material.metalness = metalness;
    }

    setMetalnessMap(metalnessMap) {
        if(this._metalnessMap == metalnessMap) return;
        this._setTexture('metalnessMap', metalnessMap);
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

    setRoughness(roughness) {
        if(this._roughness == roughness) return;
        this._roughness = roughness;
        this._material.roughness = roughness;
    }

    setRoughnessMap(roughnessMap) {
        if(this._roughnessMap == roughnessMap) return;
        this._setTexture('roughnessMap', roughnessMap);
    }

    setWireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }

    static assetId = 'a6a1aa81-50a6-4773-aaf5-446d418c9817';
    static assetName = 'Standard Material';
}

MaterialsHandler.registerAsset(StandardMaterial);
LibraryHandler.loadBuiltIn(StandardMaterial);
