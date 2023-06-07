/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, AudioHandler, EditorHelpers, LibraryHandler, ProjectHandler, MenuInputs, getCamera, isEditor, utils } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { ColorInput, EnumInput, NumberInput, TextInput } = MenuInputs;
const { numberOr } = utils;

import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

const FONT_FAMILY = 'https://cdn.jsdelivr.net/npm/msdf-fonts/build/custom/digitalbacon-OpenSans-Regular-msdf.json';
const FONT_TEXTURE = 'https://cdn.jsdelivr.net/npm/msdf-fonts/build/custom/digitalbacon-OpenSans-Regular-msdf.png';

export default class Text extends CustomAssetEntity {
    constructor(params = {}) {
        super(params);
        this._backgroundColor = new THREE.Color(
            numberOr(params['backgroundColor'],  0x000000));
        this._backgroundOpacity = numberOr(params['backgroundOpacity'], 1);
        this._borderRadius = numberOr(params['borderRadius'], 0.1);
        this._fontColor = new THREE.Color(
            numberOr(params['fontColor'], 0xffffff));
        this._fontSize = numberOr(params['fontSize'], 0.1);
        this._justifyContent = params['justifyContent'] || 'center';
        this._padding = numberOr(params['padding'], 0);
        this._text = params['text'] || 'Hi :)';
        this._height = numberOr(params['height'], 1);
        this._width = numberOr(params['width'], 1);
        this._createMesh();
    }

    _createMesh() {
        this._block = new ThreeMeshUI.Block({
            backgroundColor: this._backgroundColor,
            backgroundOpacity: this._backgroundOpacity,
            borderRadius: this._borderRadius,
            //borderWidth: 0.001,
            //borderColor: Colors.white,
            //borderOpacity: 0.75,
            fontFamily: FONT_FAMILY,
            fontTexture: FONT_TEXTURE,
            height: this._height,
            justifyContent: this._justifyContent,
            padding: this._padding,
            width: this._width,
        });
        this._textComponent = new ThreeMeshUI.Text({
            content: this._text,
            fontColor: this._fontColor,
            fontSize: this._fontSize,
            offset: 0,
        });
        this._block.add(this._textComponent);
        this._object.add(this._block);
    }

    _getDefaultName() {
        return Text.assetName;
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addNewAsset(this._assetId, params);
    }

    exportParams() {
        let params = super.exportParams();
        params['backgroundColor'] = this._backgroundColor.getHex();
        params['backgroundOpacity'] = this._backgroundOpacity;
        params['borderRadius'] = this._borderRadius;
        params['fontColor'] = this._fontColor.getHex();
        params['fontSize'] = this._fontSize;
        params['height'] = this._height;
        params['justifyContent'] = this._justifyContent;
        params['padding'] = this._padding;
        params['text'] = this._text;
        params['width'] = this._width;
        return params;
    }

    getBackgroundColor() {
        return this._backgroundColor.getHex();
    }

    getBackgroundOpacity() {
        return this._backgroundOpacity;
    }

    getBorderRadius() {
        return this._borderRadius;
    }

    getFontColor() {
        return this._fontColor.getHex();
    }

    getFontSize() {
        return this._fontSize;
    }

    getJustifyContent() {
        return this._justifyContent;
    }

    getPadding() {
        return this._padding;
    }

    getText() {
        return this._text;
    }

    getHeight() {
        return this._height;
    }

    getWidth() {
        return this._width;
    }

    setBackgroundColor(backgroundColor) {
        this._backgroundColor.set(backgroundColor);
        this._block.set({ backgroundColor: this._backgroundColor });
    }

    setBackgroundOpacity(backgroundOpacity) {
        this._backgroundOpacity = backgroundOpacity;
        this._block.set({ backgroundOpacity: backgroundOpacity });
    }

    setBorderRadius(borderRadius) {
        this._borderRadius = borderRadius;
        this._block.set({ borderRadius: borderRadius });
    }

    setFontColor(fontColor) {
        this._fontColor.set(fontColor);
        this._textComponent.set({ fontColor: this._fontColor });
    }

    setFontSize(fontSize) {
        this._fontSize = fontSize;
        this._textComponent.set({ fontSize: fontSize });
    }

    setJustifyContent(justifyContent) {
        this._justifyContent = justifyContent;
        this._block.set({ justifyContent: justifyContent });
    }

    setPadding(padding) {
        this._padding = padding;
        this._block.set({ padding: padding });
    }

    setText(text) {
        this._text = text;
        this._textComponent.set({ content: text });
    }

    setHeight(height) {
        this._height = height;
        this._block.set({ height: height });
    }

    setWidth(width) {
        this._width = width;
        this._block.set({ width: width });
    }

    static assetId = '270aff2d-3706-4b36-bc36-c13c974d819f';
    static assetName = 'Text';
}

ProjectHandler.registerAsset(Text);

if(EditorHelpers) {
    class TextHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
        }

        place(intersection) {
            let camera = getCamera();
            let vector3 = new THREE.Vector3();
            let object = intersection.object;
            let point = intersection.point;
            let face = intersection.face;
            object.updateMatrixWorld();
            let normal = intersection.face.normal.clone()
                .transformDirection(object.matrixWorld).clampLength(0, 0.001);
            if(camera.getWorldDirection(vector3).dot(normal) > 0)
                normal.negate();
            this._object.position.copy(normal).add(point);
            this._object.lookAt(normal.add(this._object.position));
            this.roundAttributes(true);
        }

        static fields = [
            { "parameter": "visualEdit" },
            { "parameter": "text", "name": "Text", "type": TextInput },
            { "parameter": "fontSize", "name": "Font Size", "min": 0,
                "type": NumberInput },
            { "parameter": "width", "name": "Width", "min": 0.000001,
                "type": NumberInput },
            { "parameter": "height", "name": "Height", "min": 0.000001,
                "type": NumberInput },
            { "parameter": "fontColor", "name": "Font Color",
                "type": ColorInput },
            { "parameter": "backgroundColor", "name": "Background Color",
                "type": ColorInput },
            { "parameter": "backgroundOpacity", "name": "Background Opacity",
                "min": 0, "type": NumberInput },
            { "parameter": "borderRadius", "name": "Border Radius",
                "min": 0, "type": NumberInput },
            { "parameter": "padding", "name": "Padding",
                "min": 0, "type": NumberInput },
            { "parameter": "justifyContent", "name": "Justify Content",
                "map": { "Start": "start", "Center": "center", "End": "end" },
                "type": EnumInput },
            { "parameter": "position" },
            { "parameter": "rotation" },
            { "parameter": "scale" },
        ];
    }

    EditorHelperFactory.registerEditorHelper(TextHelper,
        Text);
}
