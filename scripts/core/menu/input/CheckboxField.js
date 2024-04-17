/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { configureOrbitDisabling } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Checkbox, Span, Text } from '/scripts/DigitalBacon-UI.js';

class CheckboxField extends MenuField {
    constructor(params) {
        super(params);
        let initialValue = params['initialValue'] || false;
        let title = params['title'] || 'Missing Field Name...';
        let titleWidth = params['titleWidth'] || 0.14;
        let swapOrder = params['swapOrder'] || false;
        this._suppressMenuFocusEvent = params['suppressMenuFocusEvent'];
        this._createInputs(initialValue, title, titleWidth, swapOrder);
    }

    _createInputs(initialValue, title, titleWidth, swapOrder) {
        this._checkbox = new Checkbox({
            height: 0.04,
            width: 0.04,
        });
        configureOrbitDisabling(this._checkbox);
        if(swapOrder) {
            this.add(this._checkbox);
            this._addTitle(title, titleWidth).textAlign = 'right';
        } else {
            this._addTitle(title, titleWidth);
            this.add(this._checkbox);
        }
        this._checkbox.checked = initialValue;
        this._checkbox.onChange = (value) => {
            if(this._onUpdate) this._onUpdate(value);
            PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
                'id': this._id,
                'targetOnlyMenu': this._suppressMenuFocusEvent,
            });
        };
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        if(this._getFromSource() != this._checkbox.checked)
            this._checkbox.checked = !this._checkbox.checked;
    }
}

export default CheckboxField;
