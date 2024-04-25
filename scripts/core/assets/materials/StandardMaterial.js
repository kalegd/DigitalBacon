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
              "envMap", "metalnessMap", "normalMap", "roughnessMap"];

export default class StandardMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = StandardMaterial.assetId;
        super(params);
        this._color = numberOr(params['color'], 0x3d9970);
        this._alphaMapId = params['alphaMapId'];
        this._bumpMapId = params['bumpMapId'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._displacementMapId = params['displacementMapId'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._emissive = params['emissive'] || 0x000000;
        this._emissiveMapId = params['emissiveMapId'];
        this._emissiveIntensity = numberOr(params['emissiveIntensity'], 1);
        this._envMapId = params['envMapId'];
        this._envMapIntensity = numberOr(params['envMapIntensity'], 1);
        this._flatShading = params['flatShading'] || false;
        this._mapId = params['mapId'];
        this._metalness = numberOr(params['metalness'], 0);
        this._metalnessMapId = params['metalnessMapId'];
        this._normalMapId = params['normalMapId'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        this._normalScale = params['normalScale'] || [1,1];
        this._roughness = numberOr(params['roughness'], 1);
        this._roughnessMapId = params['roughnessMapId'];
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
            "opacity": this._opacity,
            "side": this._side,
            "transparent": this._transparent,
            "roughness": this._roughness,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshStandardMaterial(materialParams);
        this._material.normalScale.fromArray(this._normalScale);
    }

    getMaps() {
        return MAPS;
    }

    getSampleTexture() {
        return this._material.map;
    }

    exportParams() {
        let params = super.exportParams();
        params['alphaMapId'] = this._alphaMapId;
        params['bumpMapId'] = this._bumpMapId;
        params['bumpScale'] = this._bumpScale;
        params['color'] = this._material.color.getHex();
        params['displacementMapId'] = this._displacementMapId;
        params['displacementScale'] = this._displacementScale;
        params['displacementBias'] = this._displacementBias;
        params['emissive'] = this._material.emissive.getHex();
        params['emissiveMapId'] = this._emissiveMapId;
        params['emissiveIntensity'] = this._emissiveIntensity;
        params['envMapId'] = this._envMapId;
        params['envMapIntensity'] = this._envMapIntensity;
        params['flatShading'] = this._flatShading;
        params['mapId'] = this._mapId;
        params['metalness'] = this._metalness;
        params['metalnessMapId'] = this._metalnessMapId;
        params['normalMapId'] = this._normalMapId;
        params['normalMapType'] = this._normalMapType;
        params['normalScale'] = this._normalScale;
        params['roughness'] = this._roughness;
        params['roughnessMapId'] = this._roughnessMapId;
        params['wireframe'] = this._wireframe;
        return params;
    }

    get alphaMapId() { return this._alphaMapId; }
    get bumpMapId() { return this._bumpMapId; }
    get bumpScale() { return this._bumpScale; }
    get color() { return this._color; }
    get displacementBias() { return this._displacementBias; }
    get displacementMapId() { return this._displacementMapId; }
    get displacementScale() { return this._displacementScale; }
    get emissive() { return this._emissive; }
    get emissiveIntensity() { return this._emissiveIntensity; }
    get emissiveMapId() { return this._emissiveMapId; }
    get envMapId() { return this._envMapId; }
    get envMapIntensity() { return this._envMapIntensity; }
    get flatShading() { return this._flatShading; }
    get mapId() { return this._mapId; }
    get metalness() { return this._metalness; }
    get metalnessMapId() { return this._metalnessMapId; }
    get normalMapId() { return this._normalMapId; }
    get normalMapType() { return this._normalMapType; }
    get normalScale() { return this._normalScale; }
    get roughness() { return this._roughness; }
    get roughnessMapId() { return this._roughnessMapId; }
    get wireframe() { return this._wireframe; }

    set alphaMapId(alphaMapId) {
        if(this._alphaMapId == alphaMapId) return;
        this._setTexture('alphaMap', alphaMapId);
    }

    set bumpMapId(bumpMapId) {
        if(this._bumpMapId == bumpMapId) return;
        this._setTexture('bumpMap', bumpMapId);
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

    set displacementBias(displacementBias) {
        if(this._displacementBias == displacementBias) return;
        this._displacementBias = displacementBias;
        this._material.displacementBias = displacementBias;
    }

    set displacementMapId(displacementMapId) {
        if(this._displacementMapId == displacementMapId) return;
        this._setTexture('displacementMap', displacementMapId);
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

    set emissiveMapId(emissiveMapId) {
        if(this._emissiveMapId == emissiveMapId) return;
        this._setTexture('emissiveMap', emissiveMapId);
    }

    set envMapId(envMapId) {
        if(this._envMapId == envMapId) return;
        this._setTexture('envMap', envMapId);
    }

    set envMapIntensity(envMapIntensity) {
        if(this._envMapIntensity == envMapIntensity) return;
        this._envMapIntensity = envMapIntensity;
        this._material.envMapIntensity = envMapIntensity;
    }

    set flatShading(flatShading) {
        if(this._flatShading == flatShading) return;
        this._flatShading = flatShading;
        this._material.flatShading = flatShading;
        this._material.needsUpdate = true;
    }

    set mapId(mapId) {
        if(this._mapId == mapId) return;
        this._setTexture('map', mapId);
    }

    set metalness(metalness) {
        if(this._metalness == metalness) return;
        this._metalness = metalness;
        this._material.metalness = metalness;
    }

    set metalnessMapId(metalnessMapId) {
        if(this._metalnessMapId == metalnessMapId) return;
        this._setTexture('metalnessMap', metalnessMapId);
    }

    set normalMapId(normalMapId) {
        if(this._normalMapId == normalMapId) return;
        this._setTexture('normalMap', normalMapId);
    }

    set normalMapType(normalMapType) {
        if(this._normalMapType == normalMapType) return;
        this._normalMapType = normalMapType;
        this._material.normalMapType = normalMapType;
        this._material.needsUpdate = true;
    }

    set normalScale(normalScale) {
        this._normalScale = normalScale;
        this._material.normalScale.fromArray(normalScale);
    }

    set roughness(roughness) {
        if(this._roughness == roughness) return;
        this._roughness = roughness;
        this._material.roughness = roughness;
    }

    set roughnessMapId(roughnessMapId) {
        if(this._roughnessMapId == roughnessMapId) return;
        this._setTexture('roughnessMap', roughnessMapId);
    }

    set wireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }

    static assetId = 'a6a1aa81-50a6-4773-aaf5-446d418c9817';
    static assetName = 'Standard Material';
}

ProjectHandler.registerAsset(StandardMaterial);
LibraryHandler.loadBuiltIn(StandardMaterial);
