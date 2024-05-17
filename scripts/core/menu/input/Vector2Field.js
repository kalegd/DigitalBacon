/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { FontSizes, Styles } from '/scripts/core/helpers/constants.js';
import { configureOrbitDisabling } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { NumberInput, Div, Span, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class Vector2Field extends MenuField {
    constructor(params) {
        super(params);
        this.height = 0.085;
        this._onBlur = params['onBlur'];
        this._lastValue = params['initialValue'] || [0, 0];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
    }

    _createInputs(title) {
        this._addTitle(title, 0.09);
        let columnBlock = new Div({
            alignItems: 'end',
            height: 0.085,
            justifyContent: 'center',
            width: 0.22,
        });
        this._addInputRow('x', this._lastValue[0], columnBlock);
        this._addInputRow('y', this._lastValue[1], columnBlock);
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
        input.onFocus = () => { global.keyboardLock = true; };
        input.value = initialValue;
        row.add(label);
        row.add(input);
        block.add(row);
        this['_' + param + 'Input'] = input;
    }

    _update() {
        let newValue = [this.getX(), this.getY()];
        if(this._onUpdate) this._onUpdate(newValue);
    }

    _blur() {
        global.keyboardLock = false;
        let newValue = [this.getX(), this.getY()];
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
    }

    getX() {
        return Number.parseFloat(this._xInput.value);
    }

    getY() {
        return Number.parseFloat(this._yInput.value);
    }

    deactivate() {
        this._xInput.blur();
        this._yInput.blur();
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let value = this._getFromSource();
        if(value[0] != this._lastValue[0] || value[1] != this._lastValue[1]) {
            this._lastValue = value;
            this._xInput.value = value[0];
            this._yInput.value = value[1];
        }
    }
}

export default Vector2Field;
