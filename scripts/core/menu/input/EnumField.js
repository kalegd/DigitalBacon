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
import { Select, Span, Text } from '/scripts/DigitalBacon-UI.js';

class EnumField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        let options = params['options'] || [];
        this._createInputs(title, options);
    }

    _createInputs(title, options) {
        this._addTitle(title);
        this._selectBox = new Select({
            height: 0.03,
            width: 0.17,
        });
        this._selectBox.addOptions(...options);
        this._selectBox.value = this._lastValue;
        this._selectBox.onChange = (option) => this._handleSelection(option);
        this.add(this._selectBox);
        configureOrbitDisabling(this._selectBox);
    }

    _handleSelection(option) {
        if(this._lastValue != option) {
            if(this._onUpdate) this._onUpdate(option);
            this._lastValue = option;
        }
    }

    deactivate() {
        this._hideOptions;
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let newValue = this._getFromSource();
        if(newValue != this._lastValue) {
            this._lastValue = newValue;
            this._selectBox.value = newValue;
        }
    }
}

export default EnumField;
