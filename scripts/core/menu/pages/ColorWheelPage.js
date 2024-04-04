/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Colors, FontSizes, vector3s } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import ColorWheel from '/scripts/core/menu/input/ColorWheel.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';
import * as THREE from 'three';

const RADIUS = 0.1;
const HSL = {};

class ColorWheelPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
        this._createCursors();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Color Picker',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
        });
        this._container.add(this._titleBlock);

        let rowBlock = new ThreeMeshUI.Block({
            'height': RADIUS * 2,
            'width': RADIUS * 2.5,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'offset': 0,
        });

        this._colorBlock = new ThreeMeshUI.Block({
            'height': RADIUS * 2,
            'width': RADIUS * 2,
            'backgroundOpacity': 1,
            'backgroundTexture': ColorWheel.getColorTexture(),
            'margin': 0.02,
            'borderWidth': 0,
        });
        this._lightnessBlock = new ThreeMeshUI.Block({
            'height': RADIUS * 2,
            'width': RADIUS / 5,
            'backgroundOpacity': 1,
            'backgroundTexture': ColorWheel.getLightnessTexture(),
            'backgroundSize': 'stretch',
            'margin': 0.02,
        });
        let colorInteractable = new PointerInteractable(this._colorBlock);
        colorInteractable.addEventListener('down',
            (message) => colorInteractable.capture(message.owner));
        colorInteractable.addEventListener('drag',
            (message) => this._handleColorCursorDrag(message.point));
        colorInteractable.addEventListener('click', (message) => {
            this._handleColorCursorDrag(message.point);
            this._isDraggingColorCursor = false;
            if(this._onEnter) this._onEnter();
        });
        let lightnessInteractable=new PointerInteractable(this._lightnessBlock);
        lightnessInteractable.addEventListener('down',
            (message) => lightnessInteractable.capture(message.owner));
        lightnessInteractable.addEventListener('drag', (message) => {
            this._handleLightnessCursorDrag(message.point);
        });
        lightnessInteractable.addEventListener('click', (message) => {
            this._handleLightnessCursorDrag(message.point);
            this._isDraggingLightnessCursor = false;
            if(this._onEnter) this._onEnter();
        });
        rowBlock.add(this._colorBlock);
        rowBlock.add(this._lightnessBlock);
        this._container.add(rowBlock);
        this._containerInteractable.addChild(colorInteractable);
        this._containerInteractable.addChild(lightnessInteractable);
    }

    _handleColorCursorDrag(point) {
        if(!point) return;
        vector3s[0].copy(point);
        this._colorBlock.worldToLocal(vector3s[0]);
        let color = ColorWheel.selectColorFromXY(RADIUS, vector3s[0].x,
            vector3s[0].y);
        if(color && this._onUpdate) {
            this._onUpdate(color);
            this._updateColorCursor();
            if(!this._colorCursor.visible) {
                this._colorCursor.visible = true;
            }
        }
        this._isDraggingColorCursor = true;
    }

    _handleLightnessCursorDrag(point) {
        if(!point) return;
        vector3s[0].copy(point);
        this._lightnessBlock.worldToLocal(vector3s[0]);
        let color = ColorWheel.selectLightnessFromXY(RADIUS * 2,
            vector3s[0].x, vector3s[0].y);
        if(color && this._onUpdate) {
            this._onUpdate(color);
            this._updateLightnessCursor();
            if(!this._lightnessCursor.visible) {
                this._lightnessCursor.visible = true;
            }
        }
        this._isDraggingLightnessCursor = true;
    }

    _createCursors() {
        let geometry = new THREE.RingGeometry(RADIUS / 12, RADIUS / 10, 16);
        let material = new THREE.MeshBasicMaterial({
            color: Colors.white,
            side: THREE.FrontSide,
        });
        this._colorCursor = new THREE.Mesh(geometry, material);
        this._colorCursor.position.setZ(0.015);
        this._object.add(this._colorCursor);
        this._colorCursor.visible = false;

        geometry = new THREE.RingGeometry(RADIUS / 9, RADIUS / 7.5,
            4, 1, Math.PI / 4);
        let positions = geometry.getAttribute("position");
        for(let i = 0; i < positions.count; i++) {
            let y = positions.getY(i);
            if(y > 0) positions.setY(i, y - RADIUS / 20);
            if(y < 0) positions.setY(i, y + RADIUS / 20);
        }
        material = new THREE.MeshBasicMaterial({
            color: Colors.white,
            side: THREE.FrontSide,
        });
        this._lightnessCursor = new THREE.Mesh(geometry, material);
        this._lightnessCursor.position.setZ(0.0105);
        this._object.add(this._lightnessCursor);
        this._lightnessCursor.visible = false;
    }

    _updateColorCursor() {
        let [x, y] = ColorWheel.getXY(RADIUS);
        vector3s[0].set(x, -y, 0);
        this._object.worldToLocal(this._colorBlock.localToWorld(
            vector3s[0]));
        this._colorCursor.position.setX(vector3s[0].x);
        this._colorCursor.position.setY(vector3s[0].y);
    }

    _updateLightnessCursor() {
        let lightness = ColorWheel.getLightness(RADIUS);
        vector3s[0].set(0, (lightness - 0.5) * RADIUS * 2, 0);
        this._object.worldToLocal(this._lightnessBlock.localToWorld(
            vector3s[0]));
        this._lightnessCursor.position.setX(vector3s[0].x);
        this._lightnessCursor.position.setY(vector3s[0].y);
    }

    setContent(requesterId, color, onUpdate, onEnter) {
        ColorWheel.setFromHSL(color.getHSL(HSL, THREE.SRGBColorSpace));
        this._updateColorCursor();
        this._updateLightnessCursor();
        this._requesterId = requesterId;
        this._onUpdate = onUpdate;
        this._onEnter = onEnter;
    }

    updateColor(requesterId, color) {
        if(!this._object.parent || this._requesterId != requesterId) return;
        ColorWheel.setFromHSL(color.getHSL(HSL));
        this._updateColorCursor();
        this._updateLightnessCursor();
    }

    isDraggingCursors() {
        return this._isDraggingColorCursor || this._isDraggingLightnessCursor;
    }

    back() {
        //TODO: Will need to add text field later to allow color choice by hex
        //this._textField.deactivate();
        this._onUpdate = null;
        super.back();
    }

}

export default ColorWheelPage;
