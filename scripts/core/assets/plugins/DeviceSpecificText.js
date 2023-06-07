/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, AudioHandler, EditorHelpers, LibraryHandler, ProjectHandler, MenuInputs, getCamera, getDeviceType, isEditor, utils } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { ColorInput, EnumInput, NumberInput, TextInput } = MenuInputs;
const { numberOr } = utils;
const deviceType = getDeviceType();

import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

const FONT_FAMILY = 'https://cdn.jsdelivr.net/npm/msdf-fonts/build/custom/digitalbacon-OpenSans-Regular-msdf.json';
const FONT_TEXTURE = 'https://cdn.jsdelivr.net/npm/msdf-fonts/build/custom/digitalbacon-OpenSans-Regular-msdf.png';

export default class DeviceSpecificText extends CustomAssetEntity {
    constructor(params = {}) {
        super(params);
        this._backgroundColor = new THREE.Color(
            numberOr(params['backgroundColor'],  0x000000));
        this._backgroundOpacity = numberOr(params['backgroundOpacity'], 1);
        this._borderRadius = numberOr(params['borderRadius'], 0.1);
        this._deviceType = deviceType;
        this._fontColor = new THREE.Color(
            numberOr(params['fontColor'], 0xffffff));
        this._fontSize = numberOr(params['fontSize'], 0.1);
        this._justifyContent = params['justifyContent'] || 'center';
        this._padding = numberOr(params['padding'], 0);
        this._pointerText = params['pointerText'] || 'Hi Computer';
        this._mobileText = params['mobileText'] || 'Hi Mobile';
        this._xrText = params['xrText'] || 'Hi XR';
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
            content: this._getDeviceText(),
            fontColor: this._fontColor,
            fontSize: this._fontSize,
            offset: 0,
        });
        this._block.add(this._textComponent);
        this._object.add(this._block);
    }

    _getDefaultName() {
        return DeviceSpecificText.assetName;
    }

    _getDeviceText() {
        if(this._deviceType == 'POINTER') {
            return this._pointerText;
        } else if(this._deviceType == 'MOBILE') {
            return this._mobileText;
        } else {
            return this._xrText;
        }
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
        params['pointerText'] = this._pointerText;
        params['mobileText'] = this._mobileText;
        params['xrText'] = this._xrText;
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

    getMobileText() {
        return this._mobileText;
    }

    getPointerText() {
        return this._pointerText;
    }

    getXrText() {
        return this._xrText;
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

    setMobileText(mobileText) {
        this._mobileText = mobileText;
        if(this._deviceType == 'MOBILE')
            this._textComponent.set({ content: mobileText });
    }

    setPointerText(pointerText) {
        this._pointerText = pointerText;
        if(this._deviceType == 'POINTER')
            this._textComponent.set({ content: pointerText });
    }

    setXrText(xrText) {
        this._xrText = xrText;
        if(this._deviceType == 'XR')
            this._textComponent.set({ content: xrText });
    }

    setHeight(height) {
        this._height = height;
        this._block.set({ height: height });
    }

    setWidth(width) {
        this._width = width;
        this._block.set({ width: width });
    }

    static assetId = '1b67a2a6-0049-4074-8b37-0c65010909ad';
    static assetName = 'Device Specific Text';
}

ProjectHandler.registerAsset(DeviceSpecificText);

if(EditorHelpers) {
    class DeviceSpecificTextHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
            this._previewDevice = deviceType;
            this._createPreviewFunctions();
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

        _createPreviewFunctions() {
            this._asset.getPreviewDevice = () => { return this._previewDevice;};
            this._asset.setPreviewDevice = (previewDevice) => {
                this._previewDevice = previewDevice;
                this._asset._deviceType = previewDevice;
                let text = this._asset._getDeviceText();
                this._asset._textComponent.set({ content: text });
            }
        }

        static fields = [
            { "parameter": "visualEdit" },
            { "parameter": "pointerText", "name": "Computer Text", "type": TextInput },
            { "parameter": "mobileText", "name": "Mobile Text", "type": TextInput },
            { "parameter": "xrText", "name": "XR Text", "type": TextInput },
            { "parameter": "previewDevice", "name": "Preview Device",
                "map": { "Computer": "POINTER", "Mobile": "MOBILE", "XR": "XR"},
                "type": EnumInput },
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

    EditorHelperFactory.registerEditorHelper(DeviceSpecificTextHelper,
        DeviceSpecificText);
}
