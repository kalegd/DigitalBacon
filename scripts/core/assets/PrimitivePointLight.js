/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveLight from '/scripts/core/assets/PrimitiveLight.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import PrimitivePointLightHelper from '/scripts/core/helpers/editor/PrimitivePointLightHelper.js';
import * as THREE from 'three';

const ASSET_ID = '944a6b29-05d2-47d9-9b33-60e7a3e18b7d';
const ASSET_NAME = 'Basic Light';

export default class PrimitivePointLight extends PrimitiveLight {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._distance = numberOr(params['distance'], 0);
        this._decay = numberOr(params['decay'], 1);
        this._createLight();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createEditorHelper() {
        this._editorHelper = new PrimitivePointLightHelper(this);
    }

    _createLight() {
        this._light = new THREE.PointLight(this._color, this._intensity,
            this._distance, this._decay);
        this._object.add(this._light);
    }

    _updateLight() {
        super._updateLight();
        this._light.distance = this._distance;
        this._light.decay = this._decay;
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
}

ProjectHandler.registerLight(PrimitivePointLight, ASSET_ID, ASSET_NAME);
