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
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
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
        this._color = params['initialValue'] || new THREE.Color("#2abbd5");
        this._lastValue = this._color.getHex();
        this._onUpdate = params['onUpdate'] || (() => {});
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
                (color) => { this._onUpdate(color); },
                ()      => {
                    if(colorPage.isDraggingCursors()) return;
                    let oldColor = this._lastValue;
                    let newColor = this._color.getHex();
                    this._onUpdate(newColor);
                    this._lastValue = newColor;
                    UndoRedoHandler.addAction(() => {
                        this._onUpdate(oldColor);
                        colorPage.updateColor(this._color);
                        this._lastValue = oldColor;
                    }, () => {
                        this._onUpdate(newColor);
                        colorPage.updateColor(this._color);
                        this._lastValue = newColor;
                    });
                });
            global.menuController.pushPage(MenuPages.COLOR_WHEEL);
            //this._onUpdate();
            PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
                'id': this._id,
                'targetOnlyMenu': true,
            });
        });
        this._pointerInteractable.addChild(interactable);
    }

    setLastValue(color) {
        this._lastValue = color;
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
        //Required method
    }
}

export default ColorInput;
