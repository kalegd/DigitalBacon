/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { FontSizes, Styles } from '/scripts/core/helpers/constants.js';
import { roundWithPrecision } from '/scripts/core/helpers/utils.module.js';
import { configureOrbitDisabling } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { NumberInput, Div, Span, Text } from '/scripts/DigitalBacon-UI.js';
import { MathUtils } from 'three';

class EulerField extends MenuField {
    constructor(params) {
        super(params);
        this.height = 0.11;
        this._onBlur = params['onBlur'];
        this._lastValue = params['initialValue'] || [0, 0, 0];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
    }

    _createInputs(title) {
        this._addTitle(title, 0.09);
        let columnBlock = new Div({
            alignItems: 'end',
            height: 0.11,
            justifyContent: 'center',
            width: 0.22,
        });
        this._addInputRow('x', toDegrees(this._lastValue[0]), columnBlock);
        this._addInputRow('y', toDegrees(this._lastValue[1]), columnBlock);
        this._addInputRow('z', toDegrees(this._lastValue[2]), columnBlock);
        this.add(columnBlock);
    }

    _addInputRow(param, initialValue, block) {
        let row = new Span({
            height: 0.03,
        });
        let label = new Text(param.toUpperCase(), Styles.bodyText,
            { marginRight: 0.008 });
        let input = new NumberInput({
            fontSize: FontSizes.body,
            height: 0.03,
            width: 0.17,
        });
        configureOrbitDisabling(input);
        input.pointerInteractable.hoveredCursor = 'text';
        input.onBlur = () => this._blur();
        input.onChange = () => this._update();
        input.onEnter = () => input.blur();
        input.value = initialValue;
        row.add(label);
        row.add(input);
        block.add(row);
        this['_' + param + 'Input'] = input;
    }

    _update(index) {
        let newValue = [this.getX(), this.getY(), this.getZ()];
        newValue.forEach((v, i) => newValue[i] = MathUtils.degToRad(v));
        if(this._onUpdate) this._onUpdate(newValue);
    }

    _blur() {
        let newValue = [this.getX(), this.getY(), this.getZ()];
        newValue.forEach((v, i) => newValue[i] = MathUtils.degToRad(v));
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
    }

    getX() {
        return Number.parseFloat(this._xInput.value);
    }

    getY() {
        return Number.parseFloat(this._yInput.value);
    }

    getZ() {
        return Number.parseFloat(this._zInput.value);
    }

    deactivate() {
        this._xInput.blur();
        this._yInput.blur();
        this._zInput.blur();
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let value = this._getFromSource();
        if(value[0] != this._lastValue[0] || value[1] != this._lastValue[1]
                || value[2] != this._lastValue[2]) {
            this._lastValue = value;
            this._xInput.value = toDegrees(value[0]);
            this._yInput.value = toDegrees(value[1]);
            this._zInput.value = toDegrees(value[2]);
        }
    }

    get disabled() { return this._disabled; }
    set disabled(disabled) {
        this._disabled = disabled;
        if(disabled) {
            for(let input of [this._xInput, this._yInput, this._zInput]) {
                input.blur();
                input.pointerInteractable.disabled = true;
                input.touchInteractable.disabled = true;
            }
        } else {
            for(let input of [this._xInput, this._yInput, this._zInput]) {
                input.pointerInteractable.disabled = false;
                input.touchInteractable.disabled = false;
            }
        }
    }
}

export default EulerField;

////////////////////////////

function toDegrees(radians) {
    return String(roundWithPrecision(MathUtils.radToDeg(radians), 5));
}
