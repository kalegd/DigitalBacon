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

const MAPS = ["map", "alphaMap", "bumpMap", "displacementMap", "emissiveMap",
              "envMap", "normalMap", "specularMap"];

export default class PhongMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = PhongMaterial.assetId;
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
        return PhongMaterial.assetName;
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

    get alphaMap() { return this._alphaMap; }
    get bumpMap() { return this._bumpMap; }
    get bumpScale() { return this._bumpScale; }
    get color() { return this._color; }
    get combine() { return this._combine; }
    get displacementBias() { return this._displacementBias; }
    get displacementMap() { return this._displacementMap; }
    get displacementScale() { return this._displacementScale; }
    get emissive() { return this._emissive; }
    get emissiveIntensity() { return this._emissiveIntensity; }
    get emissiveMap() { return this._emissiveMap; }
    get envMap() { return this._envMap; }
    get flatShading() { return this._flatShading; }
    get map() { return this._map; }
    get normalMap() { return this._normalMap; }
    get normalMapType() { return this._normalMapType; }
    get normalScale() { return this._normalScale; }
    get reflectivity() { return this._reflectivity; }
    get refractionRatio() { return this._refractionRatio; }
    get shininess() { return this._shininess; }
    get specular() { return this._specular; }
    get specularMap() { return this._specularMap; }
    get wireframe() { return this._wireframe; }

    set alphaMap(alphaMap) {
        if(this._alphaMap == alphaMap) return;
        this._setTexture('alphaMap', alphaMap);
    }

    set bumpMap(bumpMap) {
        if(this._bumpMap == bumpMap) return;
        this._setTexture('bumpMap', bumpMap);
    }

    set bumpScale(bumpScale) {
        if(this._bumpScale == bumpScale) return;
        this._bumpScale = bumpScale;
        this._material.bumpScale = bumpScale;
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

    set displacementBias(displacementBias) {
        if(this._displacementBias == displacementBias) return;
        this._displacementBias = displacementBias;
        this._material.displacementBias = displacementBias;
    }

    set displacementMap(displacementMap) {
        if(this._displacementMap == displacementMap) return;
        this._setTexture('displacementMap', displacementMap);
    }

    set displacementScale(displacementScale) {
        if(this._displacementScale == displacementScale) return;
        this._displacementScale = displacementScale;
        this._material.displacementScale = displacementScale;
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

    set flatShading(flatShading) {
        if(this._flatShading == flatShading) return;
        this._flatShading = flatShading;
        this._material.flatShading = flatShading;
        this._material.needsUpdate = true;
    }

    set map(map) {
        if(this._map == map) return;
        this._setTexture('map', map);
    }

    set normalMap(normalMap) {
        if(this._normalMap == normalMap) return;
        this._setTexture('normalMap', normalMap);
    }

    set normalMapType(normalMapType) {
        if(this._normalMapType == normalMapType) return;
        this._normalMapType = normalMapType;
        this._material.normalMapType = normalMapType;
        this._material.needsUpdate = true;
    }

    set normalScale(normalScale) {
        if(this._normalScale == normalScale) return;
        this._normalScale = normalScale;
        this._material.normalScale = normalScale;
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

    set shininess(shininess) {
        if(this._shininess == shininess) return;
        this._shininess = shininess;
        this._material.shininess = shininess;
    }

    set specular(specular) {
        if(this._specular == specular) return;
        this._specular = specular;
        this._material.specular.setHex(specular);
    }

    set specularMap(specularMap) {
        if(this._specularMap == specularMap) return;
        this._setTexture('specularMap', specularMap);
    }

    set wireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }

    static assetId = 'c9cfa45a-99b4-4166-b252-1c68b52773b0';
    static assetName = 'Phong Material';
}

ProjectHandler.registerAsset(PhongMaterial);
LibraryHandler.loadBuiltIn(PhongMaterial);
