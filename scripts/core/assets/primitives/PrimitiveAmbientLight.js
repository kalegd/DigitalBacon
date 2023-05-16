/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveLight from '/scripts/core/assets/primitives/PrimitiveLight.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import LightsHandler from '/scripts/core/handlers/LightsHandler.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class PrimitiveAmbientLight extends PrimitiveLight {
    constructor(params = {}) {
        params['assetId'] = PrimitiveAmbientLight.assetId;
        super(params);
        this._createLight();
    }

    _createLight() {
        this._light = new THREE.AmbientLight(this._color, this._intensity);
        this._object.add(this._light);
    }

    _getDefaultName() {
        return PrimitiveAmbientLight.assetName;
    }

    static assetId = '7605bff2-8ca3-4a47-b6f7-311d745507de';
    static assetName = 'Ambient Light';
}

LightsHandler.registerAsset(PrimitiveAmbientLight);
LibraryHandler.loadBuiltIn(PrimitiveAmbientLight);
