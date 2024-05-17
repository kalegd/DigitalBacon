/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Light from '/scripts/core/assets/primitives/Light.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import * as THREE from 'three';

export default class DirectionalLight extends Light {
    constructor(params = {}) {
        params['assetId'] = DirectionalLight.assetId;
        params['visualEdit'] = false;
        super(params);
        let direction = params['direction'] || [0, -1, 0];
        this._createLight();
        this.direction = direction;
    }

    _createLight() {
        this._light = new THREE.DirectionalLight(this._color, this._intensity);
        this._light.add(this._light.target);
        this._object.add(this._light);
    }

    _getDefaultName() {
        return DirectionalLight.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['direction'] = this.direction;
        return params;
    }

    get direction() { return this._light.target.position.toArray(); }

    set direction(direction) {this._light.target.position.fromArray(direction);}

    static assetId = '495a9c3f-fa4f-4c55-9a38-74f4f34450cc';
    static assetName = 'Directional Light';
}

ProjectHandler.registerAsset(DirectionalLight);
LibraryHandler.loadBuiltIn(DirectionalLight);
