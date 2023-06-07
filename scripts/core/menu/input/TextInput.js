/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 13;

class TextInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._onBlur = params['onBlur'];
        this._onUpdate = params['onUpdate'];
        this._getFromSource = params['getFromSource'];
        this._lastValue = params['initialValue'] || '';
        let title = params['title'] || 'Missing Field Name...';
        this._createInput(title);
    }

    _createInput(title) {
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
        this._textField = new TextField({
            'initialText': this._lastValue,
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._blur(); },
            'onUpdate': () => { this._update(); },
        });
        this._object.add(titleBlock);
        this._textField.addToScene(this._object, this._pointerInteractable);
    }

    _update() {
        if(this._onUpdate) {
            this._onUpdate(this.getValue());
        }
    }

    _blur() {
        let newValue = this.getValue();
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
    }

    getValue() {
        return this._textField.content;
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        this._textField.deactivate();
    }

    reset() {
        this._textField.reset();
    }

    updateFromSource() {
        if(this._getFromSource) {
            this._lastValue = this._getFromSource();
            this._textField.setContent(String(this._lastValue));
        }
    }
}

export default TextInput;
