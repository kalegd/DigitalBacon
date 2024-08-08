/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import OrbitDisablingPointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import * as THREE from 'three';

class ColorField extends MenuField {
    constructor(params) {
        super(params);
        let title = params['title'] || 'Missing Field Name...';
        this._lastValue = numberOr(params['initialValue'], 0x2abbd5);
        this._color = new THREE.Color(this._lastValue);
        this._onBlur = params['onBlur'];
        this._createInputs(title);
    }

    _createInputs(title) {
        this._addTitle(title, 0.14);
        this._colorBlock = new Span({
            backgroundVisible: true,
            borderRadius: 0.01,
            height: 0.04,
            pointerInteractableClassOverride: OrbitDisablingPointerInteractable,
            width: 0.08,
        });
        this._colorBlock.material.color = this._color;
        this.add(this._colorBlock);
        this._colorBlock.onClickAndTouch = () => {
            let colorPage =global.menuController.getPage(MenuPages.COLOR_WHEEL);
            colorPage.setContent(this._id, this._color,
                (color) => {
                    if(this._color.getHex() == color) return;
                    this._color.setHex(color);
                    if(this._onUpdate) this._onUpdate(color);
                }, ()   => {
                    if(colorPage.isDragging()) return;
                    let oldColor = this._lastValue;
                    let newColor = this._color.getHex();
                    if(this._onBlur) this._onBlur(oldColor, newColor);
                    this._lastValue = newColor;
                    this._color.setHex(this._lastValue);
                });
            global.menuController.pushPage(MenuPages.COLOR_WHEEL);
        };
    }

    updateFromSource() {
        if(this._getFromSource) {
            this._lastValue = this._getFromSource();
            this._color.setHex(this._lastValue);
            let colorPage =global.menuController.getPage(MenuPages.COLOR_WHEEL);
            colorPage.updateColor(this._id, this._color);
        }
    }
}

export default ColorField;
