/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TextAsset from '/scripts/core/assets/texts/TextAsset.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as DigitalBaconUI from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

export default class PlainText extends TextAsset {
    constructor(params = {}) {
        params['assetId'] = PlainText.assetId;
        super(params);
        this._maxWidth = numberOr(params['maxWidth'], 0);
        this._createMesh();
    }

    _createMesh() {
        this._textComponent = new DigitalBaconUI.Text(this._text, {
            color: this._fontColor,
            fontSize: this._fontSize,
            textAlign: this._textAlign,
            maxWidth: this._maxWidth || Infinity,
        });
        this._object.add(this._textComponent);
        this._configureMesh();
    }

    _configureMesh() {
        if(this._textComponent)
            this._textComponent._updateMaterialOffset(this._renderOrder - 2);
    }

    _getDefaultName() {
        return PlainText.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['maxWidth'] = this._maxWidth;
        return params;
    }

    get maxWidth() { return this._maxWidth; }

    set maxWidth(maxWidth) {
        this._maxWidth = maxWidth;
        this._textComponent.maxWidth = maxWidth || Infinity;
    }

    static assetId = 'c03485a9-1962-4ce6-9cc6-f61546a0e143';
    static assetName = 'Plain Text';
}

ProjectHandler.registerAsset(PlainText);
LibraryHandler.loadBuiltIn(PlainText);
