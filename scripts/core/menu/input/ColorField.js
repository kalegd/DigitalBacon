/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import { configureOrbitDisabling } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span, Text } from '/scripts/DigitalBacon-UI.js';
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
            width: 0.08,
        });
        this._colorBlock.material.color = this._color;
        configureOrbitDisabling(this._colorBlock);
        this.add(this._colorBlock);
        this._colorBlock.onClick = () => {
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
