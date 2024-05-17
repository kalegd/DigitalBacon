/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
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

    exportParams() {
        let params = super.exportParams();
        params['color'] = this._light.color.getHex();
        params['intensity'] = this._intensity;
        return params;
    }

    get color() { return this._color; }
    get intensity() { return this._intensity; }

    set color(color) {
        if(this._color == color) return;
        this._color = color;
        this._light.color.setHex(color);
    }

    set intensity(intensity) {
        if(this._intensity == intensity) return;
        this._intensity = intensity;
        this._light.intensity = intensity;
    }

    static assetType = AssetTypes.LIGHT;
}
