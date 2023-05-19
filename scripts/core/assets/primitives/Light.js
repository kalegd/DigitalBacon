/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';

export default class Light extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._color = numberOr(params['color'], 0xffffff);
        this._intensity = numberOr(params['intensity'], 1);
    }

    _getDefaultName() {
        return 'Light';
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addNewAsset(this._assetId, params);
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

    static assetType = AssetTypes.LIGHT;
}
