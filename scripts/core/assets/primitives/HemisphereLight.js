/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Light from '/scripts/core/assets/primitives/Light.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class HemisphereLight extends Light {
    constructor(params = {}) {
        params['assetId'] = HemisphereLight.assetId;
        params['position'] = [0, 1, 0];
        params['visualEdit'] = false;
        super(params);
        this._groundColor = numberOr(params['groundColor'], 0xffffff);
        this._createLight();
    }

    _createLight() {
        this._light = new THREE.HemisphereLight(this._color, this._groundColor,
            this._intensity);
        this._object.add(this._light);
    }

    _getDefaultName() {
        return HemisphereLight.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['groundColor'] = this._light.groundColor.getHex();
        return params;
    }

    getGroundColor() {
        return this._groundColor;
    }

    setGroundColor(groundColor) {
        if(this._groundColor == groundColor) return;
        this._groundColor = groundColor;
        this._light.groundColor.setHex(groundColor);
    }

    static assetId = '1589e804-9177-405f-9598-874cfe00c93c';
    static assetName = 'Hemisphere Light';
}

ProjectHandler.registerAsset(HemisphereLight);
LibraryHandler.loadBuiltIn(HemisphereLight);
