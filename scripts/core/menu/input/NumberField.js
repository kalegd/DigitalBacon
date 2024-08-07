/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import OrbitDisablingPointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import { NumberInput } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class NumberField extends MenuField {
    constructor(params) {
        super(params);
        this._onBlur = params['onBlur'];
        this._minValue = numberOr(params['minValue'], -Infinity);
        this._maxValue = numberOr(params['maxValue'], Infinity);
        this._lastValue = params['initialValue'] || 0;
        let title = params['title'] || 'Missing Field Name...';
        this._createInput(title);
    }

    _createInput(title) {
        this._addTitle(title);
        this._numberInput = new NumberInput({
            fontSize: FontSizes.body,
            height: 0.03,
            pointerInteractableClassOverride: OrbitDisablingPointerInteractable,
            width: 0.17,
        });
        this._numberInput.pointerInteractable.hoveredCursor = 'text';
        this._numberInput.onBlur = () => this._blur();
        this._numberInput.onChange = () => this._update();
        this._numberInput.onEnter = () => this._numberInput.blur();
        this._numberInput.onFocus = () => { global.keyboardLock = true; };
        this._numberInput.minValue = this._minValue;
        this._numberInput.maxValue = this._maxValue;
        this._numberInput.value = this._lastValue;
        this.add(this._numberInput);
    }

    _update() {
        let value = this.getValue();
        if(this._onUpdate) this._onUpdate(value);
    }

    _blur() {
        global.keyboardLock = false;
        let newValue = this.getValue();
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
    }

    getValue() {
        return Number.parseFloat(this._numberInput.value);
    }

    deactivate() {
        this._numberInput.blur();
    }

    updateFromSource() {
        if(this._getFromSource) {
            this._numberInput.value = this._lastValue = this._getFromSource();
        }
    }

    get disabled() { return this._disabled; }
    set disabled(disabled) {
        this._disabled = disabled;
        if(disabled) {
            this._numberInput.blur();
            this._numberInput.pointerInteractable.disabled = true;
            this._numberInput.touchInteractable.disabled = true;
        } else {
            this._numberInput.pointerInteractable.disabled = false;
            this._numberInput.touchInteractable.disabled = false;
        }
    }
}

export default NumberField;
