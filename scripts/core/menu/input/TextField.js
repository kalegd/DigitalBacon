/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import { configureOrbitDisabling } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { TextArea, TextInput } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class TextField extends MenuField {
    constructor(params) {
        super(params);
        this._onBlur = params['onBlur'];
        this._singleLine = params['singleLine'] || false;
        this._lastValue = params['initialValue'] || '';
        let title = params['title'] || 'Missing Field Name...';
        if(!this._singleLine) this.height = 0.1;
        this._createInput(title);
    }

    _createInput(title) {
        this._addTitle(title);
        if(this._singleLine) {
            this._textInput = new TextInput({
                fontSize: FontSizes.body,
                height: 0.03,
                width: 0.17,
            });
        } else {
            this._textInput = new TextArea({
                fontSize: FontSizes.body,
                height: 0.09,
                width: 0.17,
            });
        }
        configureOrbitDisabling(this._textInput);
        this._textInput.pointerInteractable.hoveredCursor = 'text';
        this._textInput.onBlur = () => this._blur();
        this._textInput.onChange = () => this._update();
        this._textInput.onEnter = () => this._textInput.blur();
        this._textInput.onFocus = () => { global.keyboardLock = true; };
        this.add(this._textInput);
    }

    _update() {
        if(this._onUpdate) {
            this._onUpdate(this.getValue());
        }
    }

    _blur() {
        global.keyboardLock = false;
        let newValue = this.getValue();
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
    }

    getValue() {
        return this._textInput.value;
    }

    deactivate() {
        this._textInput.blur();
    }

    updateFromSource() {
        if(this._getFromSource) {
            this._lastValue = this._getFromSource();
            this._textInput.value = this._lastValue;
        }
    }
}

export default TextField;
