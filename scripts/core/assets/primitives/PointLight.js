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

export default class PointLight extends Light {
    constructor(params = {}) {
        params['assetId'] = PointLight.assetId;
        super(params);
        this._distance = numberOr(params['distance'], 0);
        this._decay = numberOr(params['decay'], 2);
        this._createLight();
    }

    _createLight() {
        this._light = new THREE.PointLight(this._color, this._intensity,
            this._distance, this._decay);
        this._object.add(this._light);
    }

    _getDefaultName() {
        return PointLight.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['distance'] = this._distance;
        params['decay'] = this._decay;
        return params;
    }

    getDistance() {
        return this._distance;
    }

    getDecay() {
        return this._decay;
    }

    setDistance(distance) {
        if(this._distance == distance) return;
        this._distance = distance;
        this._light.distance = distance;
    }

    setDecay(decay) {
        if(this._decay == decay) return;
        this._decay = decay;
        this._light.decay = decay;
    }

    static assetId = '944a6b29-05d2-47d9-9b33-60e7a3e18b7d';
    static assetName = 'Basic Light';
}

ProjectHandler.registerAsset(PointLight);
LibraryHandler.loadBuiltIn(PointLight);
