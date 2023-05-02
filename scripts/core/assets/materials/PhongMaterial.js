/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const MAPS = ["map", "alphaMap", "bumpMap", "displacementMap", "emissiveMap", "envMap", "normalMap", "specularMap"];

export default class PhongMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._alphaMap = params['alphaMap'];
        this._bumpMap = params['bumpMap'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._color = numberOr(params['color'], 0x3d9970);
        this._combine = params['combine']
            || THREE.MultiplyOperation;
        this._displacementMap = params['displacementMap'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._emissive = params['emissive'] || 0x000000;
        this._emissiveIntensity = numberOr(params['emissiveIntensity'], 1);
        this._emissiveMap = params['emissiveMap'];
        this._envMap = params['envMap'];
        this._flatShading = params['flatShading'] || false;
        this._map = params['map'];
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        this._normalScale = params['normalScale'] || [1,1];
        this._reflectivity = numberOr(params['reflectivity'], 1);
        this._refractionRatio = numberOr(params['refractionRatio'],0.98);
        this._shininess = numberOr(params['shininess'], 30);
        this._specular = numberOr(params['specular'], 0x111111);
        this._specularMap = params['specularMap'];
        this._wireframe = params['wireframe'] || false;
        this._createMaterial();
    }

    _getDefaultName() {
        return "Phong Material";
    }

    _createMaterial() {
        let materialParams = {
            "color": this._color,
            "bumpScale": this._bumpScale,
            "combine": this._combine,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "emissive": this._emissive,
            "emissiveIntensity": this._emissiveIntensity,
            "flatShading": this._flatShading,
            "normalMapType": this._normalMapType,
            "normalScale": this._normalScale,
            "opacity": this._opacity,
            "side": this._side,
            "transparent": this._transparent,
            "reflectivity": this._reflectivity,
            "refractionRatio": this._refractionRatio,
            "shininess": this._shininess,
            "specular": this._specular,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshPhongMaterial(materialParams);
    }

    getMaps() {
        return MAPS;
    }

    getMaterialType() {
        return MaterialTypes.PHONG;
    }

    getSampleTexture() {
        return this._material.map;
    }

    exportParams() {
        let params = super.exportParams();
        params['alphaMap'] = this._alphaMap;
        params['bumpMap'] = this._bumpMap;
        params['bumpScale'] = this._bumpScale;
        params['color'] = this._color;
        params['combine'] = this._combine;
        params['displacementMap'] = this._displacementMap;
        params['displacementScale'] = this._displacementScale;
        params['displacementBias'] = this._displacementBias;
        params['emissive'] = this._emissive;
        params['emissiveIntensity'] = this._emissiveIntensity;
        params['emissiveMap'] = this._emissiveMap;
        params['envMap'] = this._envMap;
        params['flatShading'] = this._flatShading;
        params['map'] = this._map;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        params['normalScale'] = this._normalScale;
        params['reflectivity'] = this._reflectivity;
        params['refractionRatio'] = this._refractionRatio;
        params['shininess'] = this._shininess;
        params['specular'] = this._specular;
        params['specularMap'] = this._specularMap;
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

    getCombine() {
        return this._combine;
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

    getFlatShading() {
        return this._flatShading;
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

    getReflectivity() {
        return this._reflectivity;
    }

    getRefractionRatio() {
        return this._refractionRatio;
    }

    getShininess() {
        return this._shininess;
    }

    getSpecular() {
        return this._specular;
    }

    getSpecularMap() {
        return this._specularMap;
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

    setCombine(combine) {
        if(this._combine == combine) return;
        this._combine = combine;
        this._material.combine = combine;
        this._material.needsUpdate = true;
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

    setShininess(shininess) {
        if(this._shininess == shininess) return;
        this._shininess = shininess;
        this._material.shininess = shininess;
    }

    setSpecular(specular) {
        if(this._specular == specular) return;
        this._specular = specular;
        this._material.specular.setHex(specular);
    }

    setSpecularMap(specularMap) {
        if(this._specularMap == specularMap) return;
        this._setTexture('specularMap', specularMap);
    }

    setWireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }
}

MaterialsHandler.registerMaterial(PhongMaterial, MaterialTypes.PHONG);
