/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const MAPS = ["bumpMap", "displacementMap", "normalMap"];

export default class NormalMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = NormalMaterial.assetId;
        super(params);
        this._bumpMap = params['bumpMap'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._displacementMap = params['displacementMap'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._flatShading = params['flatShading'] || false;
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        this._normalScale = params['normalScale'] || [1,1];
        this._wireframe = params['wireframe'] || false;
        this._createMaterial();
    }

    _getDefaultName() {
        return NormalMaterial.assetName;
    }

    _createMaterial() {
        let materialParams = {
            "bumpScale": this._bumpScale,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "flatShading": this._flatShading,
            "normalMapType": this._normalMapType,
            "normalScale": new THREE.Vector2().fromArray(this._normalScale),
            "opacity": this._opacity,
            "side": this._side,
            "transparent": this._transparent,
            "wireframe": this._wireframe,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshNormalMaterial(materialParams);
    }

    getMaps() {
        return MAPS;
    }

    getSampleTexture() {
        return this._material.map;
    }

    exportParams() {
        let params = super.exportParams();
        params['bumpMap'] = this._bumpMap;
        params['bumpScale'] = this._bumpScale;
        params['displacementBias'] = this._displacementBias;
        params['displacementMap'] = this._displacementMap;
        params['displacementScale'] = this._displacementScale;
        params['flatShading'] = this._flatShading;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        params['normalScale'] = this._normalScale;
        params['wireframe'] = this._wireframe;
        return params;
    }

    getBumpMap() {
        return this._bumpMap;
    }

    getBumpScale() {
        return this._bumpScale;
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

    getFlatShading() {
        return this._flatShading;
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

    setBumpMap(bumpMap) {
        if(this._bumpMap == bumpMap) return;
        this._setTexture('bumpMap', bumpMap);
    }

    setBumpScale(bumpScale) {
        if(this._bumpScale == bumpScale) return;
        this._bumpScale = bumpScale;
        this._material.bumpScale = bumpScale;
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

    setFlatShading(flatShading) {
        if(this._flatShading == flatShading) return;
        this._flatShading = flatShading;
        this._material.flatShading = flatShading;
        this._material.needsUpdate = true;
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
        this._material.normalScale.fromArray(normalScale);
    }

    setWireframe(wireframe) {
        if(this._wireframe == wireframe) return;
        this._wireframe = wireframe;
        this._material.wireframe = wireframe;
        this._material.needsUpdate = true;
    }

    static assetId = '61262e1f-5495-4280-badc-b9e4599026f7';
    static assetName = 'Normal Material';
}

MaterialsHandler.registerMaterial(NormalMaterial);
