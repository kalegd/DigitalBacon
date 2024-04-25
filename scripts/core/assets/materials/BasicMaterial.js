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

const MAPS = ["map", "alphaMap", "envMap"];

export default class BasicMaterial extends Material {
    constructor(params = {}) {
        params['assetId'] = BasicMaterial.assetId;
        super(params);
        this._alphaMapId = params['alphaMapId'];
        this._color = numberOr(params['color'], 0x3d9970);
        this._combine = params['combine'] || THREE.MultiplyOperation;
        this._envMapId = params['envMapId'];
        this._mapId = params['mapId'];
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
        params['alphaMapId'] = this._alphaMapId;
        params['color'] = this._color;
        params['combine'] = this._combine;
        params['envMapId'] = this._envMapId;
        params['mapId'] = this._mapId;
        params['reflectivity'] = this._reflectivity;
        params['refractionRatio'] = this._refractionRatio;
        params['wireframe'] = this._wireframe;
        return params;
    }

    get alphaMapId() { return this._alphaMapId; }
    get color() { return this._color; }
    get combine() { return this._combine; }
    get envMapId() { return this._envMapId; }
    get mapId() { return this._mapId; }
    get reflectivity() { return this._reflectivity; }
    get refractionRatio() { return this._refractionRatio; }
    get wireframe() { return this._wireframe; }

    set alphaMapId(alphaMapId) {
        if(this._alphaMapId == alphaMapId) return;
        this._setTexture('alphaMap', alphaMapId);
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

    set envMapId(envMapId) {
        if(this._envMapId == envMapId) return;
        this._setTexture('envMap', envMapId);
    }

    set mapId(mapId) {
        if(this._mapId == mapId) return;
        this._setTexture('map', mapId);
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

    static assetId = '943b7a57-7e8f-4717-9bc6-0ba2637d9e3b';
    static assetName = 'Basic Material';
}

ProjectHandler.registerAsset(BasicMaterial);
LibraryHandler.loadBuiltIn(BasicMaterial);
