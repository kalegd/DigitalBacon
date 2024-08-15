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
import * as THREE from 'three';

export default class TextOverlay extends TextAsset {
    constructor(params = {}) {
        params['assetId'] = TextOverlay.assetId;
        super(params);
        this._backgroundColor = new THREE.Color(
            numberOr(params['backgroundColor'],  0x000000));
        this._backgroundOpacity = numberOr(params['backgroundOpacity'], 1);
        this._borderRadius = numberOr(params['borderRadius'], 0.1);
        this._justifyContent = params['justifyContent'] || 'center';
        this._padding = numberOr(params['padding'], 0);
        this._width = numberOr(params['width'], 1);
        this._height = numberOr(params['height'], 1);
        this._createMesh();
    }

    _createMesh() {
        this._block = new DigitalBaconUI.Body({
            borderRadius: this._borderRadius,
            height: this._height,
            justifyContent: this._justifyContent,
            materialColor: this._backgroundColor,
            opacity: this._backgroundOpacity,
            padding: this._padding,
            width: this._width,
        });
        this._textComponent = new DigitalBaconUI.Text(this._text, {
            color: this._fontColor,
            fontSize: this._fontSize,
            maxWidth: this._width,
            textAlign: this._textAlign,
            width: '100%',
        });
        this._block.add(this._textComponent);
        this._object.add(this._block);
        this._configureMesh();
    }

    _configureMesh() {
        if(this._block)
            this._block._updateMaterialOffset(this._renderOrder - 1);
    }

    _getDefaultName() {
        return TextOverlay.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['backgroundColor'] = this._backgroundColor.getHex();
        params['backgroundOpacity'] = this._backgroundOpacity;
        params['borderRadius'] = this._borderRadius;
        params['height'] = this._height;
        params['justifyContent'] = this._justifyContent;
        params['padding'] = this._padding;
        params['width'] = this._width;
        return params;
    }

    get backgroundColor() { return this._backgroundColor.getHex(); }
    get backgroundOpacity() { return this._backgroundOpacity; }
    get borderRadius() { return this._borderRadius; }
    get justifyContent() { return this._justifyContent; }
    get padding() { return this._padding; }
    get height() { return this._height; }
    get width() { return this._width; }

    set backgroundColor(backgroundColor) {
        this._backgroundColor.set(backgroundColor);
        this._block.materialColor = this._backgroundColor;
    }

    set backgroundOpacity(backgroundOpacity) {
        this._backgroundOpacity = backgroundOpacity;
        this._block.opacity = backgroundOpacity;
    }

    set borderRadius(borderRadius) {
        this._borderRadius = borderRadius;
        this._block.borderRadius = borderRadius;
    }

    set justifyContent(justifyContent) {
        this._justifyContent = justifyContent;
        this._block.justifyContent = justifyContent;
    }

    set padding(padding) {
        this._padding = padding;
        this._block.padding = padding;
    }

    set height(height) {
        this._height = height;
        this._block.height = height;
    }

    set width(width) {
        this._width = width;
        this._block.width = width;
        this._textComponent.maxWidth = width;
    }

    static assetId = '4feae9c5-95a9-4dd1-b4eb-b52bb47babd9';
    static assetName = 'Text Overlay';
}

ProjectHandler.registerAsset(TextOverlay);
LibraryHandler.loadBuiltIn(TextOverlay);
