/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as DigitalBaconUI from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import * as THREE from 'three';

export default class TextAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._fontColor = new THREE.Color(
            numberOr(params['fontColor'], 0xffffff));
        this._fontSize = numberOr(params['fontSize'], 0.1);
        this._text = params['text'] || 'Hi :)';
        this._textAlign = params['textAlign'] || 'left';
    }

    _createMesh() {
        this._textComponent = new DigitalBaconUI.Text(this._text, {
            color: this._fontColor,
            fontSize: this._fontSize,
            textAlign: this._textAlign,
        });
    }

    exportParams() {
        let params = super.exportParams();
        params['fontColor'] = this._fontColor.getHex();
        params['fontSize'] = this._fontSize;
        params['text'] = this._text;
        params['textAlign'] = this._textAlign;
        return params;
    }

    get fontColor() { return this._fontColor.getHex(); }
    get fontSize() { return this._fontSize; }
    get text() { return this._text; }
    get textAlign() { return this._textAlign; }

    set fontColor(fontColor) {
        this._fontColor.set(fontColor);
        this._textComponent.color = this._fontColor;
    }

    set fontSize(fontSize) {
        this._fontSize = fontSize;
        this._textComponent.fontSize = fontSize;
    }

    set text(text) {
        this._text = text;
        this._textComponent.text = text;
    }

    set textAlign(textAlign) {
        this._textAlign = textAlign;
        this._textComponent.textAlign = textAlign;
    }

    static assetType = AssetTypes.TEXT;
}
