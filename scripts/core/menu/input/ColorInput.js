/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';
import * as THREE from 'three';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.14;
const COLOR_BOX_WIDTH = 0.08;
const COLOR_BOX_HEIGHT = 0.04;

class ColorInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        let title = params['title'] || 'Missing Field Name...';
        this._lastValue = numberOr(params['initialValue'], 0x2abbd5);
        this._color = new THREE.Color(this._lastValue);
        this._onBlur = params['onBlur'];
        this._onUpdate = params['onUpdate'];
        this._getFromSource = params['getFromSource'];
        this._createInputs(title);
    }

    _createInputs(title) {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'contentDirection': 'row',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': title,
            'fontSize': FontSizes.body,
            'height': HEIGHT,
            'width': TITLE_WIDTH,
            'margin': 0,
            'textAlign': 'left',
        });
        this._colorBlock = ThreeMeshUIHelper.createColorBlock({
            'height': COLOR_BOX_HEIGHT,
            'width': COLOR_BOX_WIDTH,
            'margin': 0,
            'selectedColor': this._color,
        });
        this._object.add(titleBlock);
        this._object.add(this._colorBlock);
        let interactable = new PointerInteractable(this._colorBlock, () => {
            let colorPage =global.menuController.getPage(MenuPages.COLOR_WHEEL);
            colorPage.setContent(this._color,
                (color) => {
                    this._color.setHex(color);
                    if(this._onUpdate) this._onUpdate(color);
                }, ()   => {
                    if(colorPage.isDraggingCursors()) return;
                    let oldColor = this._lastValue;
                    let newColor = this._color.getHex();
                    if(this._onBlur) this._onBlur(oldColor, newColor);
                    this._lastValue = newColor;
                    this._color.setHex(this._lastValue);
                });
            global.menuController.pushPage(MenuPages.COLOR_WHEEL);
            PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
                'id': this._id,
                'targetOnlyMenu': true,
            });
        });
        this._pointerInteractable.addChild(interactable);
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        //Required method
    }

    updateFromSource() {
        if(this._getFromSource) {
            this._lastValue = this._getFromSource();
            this._color.setHex(this._lastValue);
        }
    }
}

export default ColorInput;
