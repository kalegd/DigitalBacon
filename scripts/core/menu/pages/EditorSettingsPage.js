/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import CheckboxField from '/scripts/core/menu/input/CheckboxField.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import { Text } from '/scripts/DigitalBacon-UI.js';

class EditorSettingsPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller, true);
        this._createFields();
    }

    _createTitleBlock() {
        this._titleBlock = new Text('Editor Settings', Styles.title);
        this.add(this._titleBlock);
    }

    _createFields() {
        let fields = [];
        fields.push(new NumberField({
            'title': 'Movement Speed',
            'minValue': 0,
            'maxValue': 1000,
            'initialValue': 4,
            'onBlur': (oldValue, newValue) => {
                SettingsHandler.setEditorSetting('Movement Speed', newValue);
            },
            'getFromSource': () =>
                SettingsHandler.getEditorSettings()['Movement Speed'],
        }));
        fields.push(new NumberField({
            'title': 'User Scale',
            'minValue': 0.001,
            'maxValue': 1000,
            'initialValue': 1,
            'onBlur': (oldValue, newValue) => {
                global.userController.scale = [newValue, newValue, newValue];
                SettingsHandler.setEditorSetting('User Scale', newValue);
            },
            'getFromSource': () =>
                SettingsHandler.getEditorSettings()['User Scale'],
        }));
        fields.push(new CheckboxField({
            'title': 'Enable Flying',
            'initialValue': true,
            'onUpdate': (value) => {
                SettingsHandler.setEditorSetting('Enable Flying', value);
            },
            'getFromSource': () =>
                SettingsHandler.getEditorSettings()['Enable Flying'],
        }));
        if(global.deviceType == "XR") {
            fields.push(new CheckboxField({
                'title': 'Swap Joysticks',
                'initialValue': false,
                'onUpdate': (value) => {
                    SettingsHandler.setEditorSetting('Swap Joysticks', value);
                },
                'getFromSource': () => {
                    let settings = SettingsHandler.getEditorSettings();
                    return settings['Swap Joysticks'];
                },
            }));
        }
        this._setFields(fields);
    }

    _onAdded() {
        for(let field of this._fields) {
            field.updateFromSource();
        }
        super._onAdded();
    }
}

export default EditorSettingsPage;
