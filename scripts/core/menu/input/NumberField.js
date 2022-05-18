/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableStates from '/scripts/core/enums/InteractableStates.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import TextField from '/scripts/core/menu/input/TextField.js';

class NumberField extends TextField {
    constructor(params) {
        super(params);
        this._lastValidNumber = params['initialText'];
        this._minValue = numberOr(params['minValue'], -Infinity);
        this._maxValue = numberOr(params['maxValue'], Infinity);
    }

    handleKey(key) {
        if(isFinite(key) || key == '-' || key == '.') {
            this.appendToContent(key);
            this._update();
        } else if(key == "Backspace") {
            this._removeFromEndOfContent();
            this._update();
        } else if(key == "Enter") {
            this.deactivate();
            if(this._onEnter) this._onEnter();
        }
    }

    _update() {
        let number = Number.parseFloat(this.content);
        if(!isNaN(number)) {
            if(number != this.content) {
                this.setContent(String(number));
            }
            if(number >= this._minValue && number <= this._maxValue) {
                this._lastValidNumber = String(number);
            }
        }
        if(this._onUpdate) this._onUpdate();
    }

    _updateDisplayedContentWithoutCursor() {
        let number = Number.parseFloat(this.content);
        if(Number.isNaN(number)) {
            this.content = String(this._lastValidNumber);
        } else if(number < this._minValue) {
            this.content = String(this._minValue);
        } else if(number > this._maxValue) {
            this.content = String(this._maxValue);
        } else {
            this._lastValidNumber = String(number);
        }
        this._updateDisplayedContent(false);
    }
}

export default NumberField;
