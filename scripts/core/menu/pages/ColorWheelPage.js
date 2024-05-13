/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Styles } from '/scripts/core/helpers/constants.js';
import { configureOrbitDisabling } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { HSLColor, Span, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import * as THREE from 'three';

const RADIUS = 0.1;
const HSL = {};

class ColorWheelPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Color Picker', Styles.title);
        this.add(titleBlock);

        let rowBlock = new Span({
            height: RADIUS * 2,
            justifyContent: 'spaceBetween',
            width: RADIUS * 3,
        });
        this._hslColor = new HSLColor(RADIUS);
        this._hslColor.onChange = (color) => {
            body.materialColor = color;
        };
        configureOrbitDisabling(this._hslColor.hueSaturationWheel);
        configureOrbitDisabling(this._hslColor.lightnessBar);
        rowBlock.add(this._hslColor.hueSaturationWheel);
        rowBlock.add(this._hslColor.lightnessBar);
        this.add(rowBlock);

        this._hslColor.onBlur = () => { if(this._onEnter) this._onEnter(); };
        this._hslColor.onChange = (color) => {
            if(this._onUpdate) this._onUpdate(color);
        };
    }

    setContent(requesterId, color, onUpdate, onEnter) {
        this._hslColor.setFromHSL(color.getHSL(HSL, THREE.SRGBColorSpace));
        this._requesterId = requesterId;
        this._onUpdate = onUpdate;
        this._onEnter = onEnter;
    }

    updateColor(requesterId, color) {
        if(!this.parent || this._requesterId != requesterId) return;
        this._hslColor.setFromHSL(color.getHSL(HSL, THREE.SRGBColorSpace));
    }

    isDragging() {
        return this._hslColor.isDragging();
    }

    back() {
        //TODO: Will need to add text field later to allow color choice by hex
        this._onUpdate = null;
        super.back();
    }

}

export default ColorWheelPage;
