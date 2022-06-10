/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import PrimitiveLightHelper from '/scripts/core/helpers/editor/PrimitiveLightHelper.js';

export default class PrimitiveLight extends Asset {
    constructor(params = {}) {
        super(params);
        this._color = numberOr(params['color'], 0xffffff);
        this._intensity = numberOr(params['intensity'], 1);
    }

    _createEditorHelper() {
        this._editorHelper = new PrimitiveLightHelper(this);
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addLight(params, this._assetId);
    }

    exportParams() {
        let params = super.exportParams();
        params['color'] = this._light.color.getHex();
        params['intensity'] = this._intensity;
        return params;
    }

    getColor() {
        return this._color;
    }

    getIntensity() {
        return this._intensity;
    }

    setColor(color) {
        if(this._color == color) return;
        this._color = color;
        this._light.color.setHex(color);
    }

    setIntensity(intensity) {
        if(this._intensity == intensity) return;
        this._intensity = intensity;
        this._light.intensity = intensity;
    }
}
