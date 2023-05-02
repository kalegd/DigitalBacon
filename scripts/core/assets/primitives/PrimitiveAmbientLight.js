/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveLight from '/scripts/core/assets/primitives/PrimitiveLight.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const ASSET_ID = '7605bff2-8ca3-4a47-b6f7-311d745507de';
const ASSET_NAME = 'Ambient Light';

export default class PrimitiveAmbientLight extends PrimitiveLight {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._createLight();
    }

    _createLight() {
        this._light = new THREE.AmbientLight(this._color, this._intensity);
        this._object.add(this._light);
    }

    _getDefaultName() {
        return ASSET_NAME;
    }
}

ProjectHandler.registerLight(PrimitiveAmbientLight, ASSET_ID, ASSET_NAME);
