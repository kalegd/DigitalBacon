/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Light from '/scripts/core/assets/primitives/Light.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class AmbientLight extends Light {
    constructor(params = {}) {
        params['assetId'] = AmbientLight.assetId;
        super(params);
        this._createLight();
    }

    _createLight() {
        this._light = new THREE.AmbientLight(this._color, this._intensity);
        this._object.add(this._light);
    }

    _getDefaultName() {
        return AmbientLight.assetName;
    }

    static assetId = '7605bff2-8ca3-4a47-b6f7-311d745507de';
    static assetName = 'Ambient Light';
}

ProjectHandler.registerAsset(AmbientLight);
LibraryHandler.loadBuiltIn(AmbientLight);
