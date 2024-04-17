/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import CheckboxField from '/scripts/core/menu/input/CheckboxField.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import { Text } from '/scripts/DigitalBacon-UI.js';

class UserSettingsPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller, true);
        this._createFields();
    }

    _createTitleBlock() {
        this._titleBlock = new Text('User Settings', Styles.title);
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
                SettingsHandler.setUserSetting('Movement Speed', newValue);
            },
            'getFromSource': () =>
                SettingsHandler.getUserSettings()['Movement Speed'],
        }));
        fields.push(new NumberField({
            'title': 'User Scale',
            'minValue': 0.001,
            'maxValue': 1000,
            'initialValue': 1,
            'onBlur': (oldValue, newValue) => {
                if(!global.isEditor) {
                    global.userController.setScale(
                        [newValue, newValue, newValue]);
                }
                SettingsHandler.setUserSetting('User Scale', newValue);
            },
            'getFromSource': () =>
                SettingsHandler.getUserSettings()['User Scale'],
        }));
        fields.push(new CheckboxField({
            'title': 'Enable Flying',
            'initialValue': true,
            'onUpdate': (value) => {
                SettingsHandler.setUserSetting('Enable Flying', value);
            },
            'getFromSource': () =>
                SettingsHandler.getUserSettings()['Enable Flying'],
        }));
        if(global.deviceType == "XR" && !global.isEditor) {
            fields.push(new CheckboxField({
                'title': 'Swap Joysticks',
                'initialValue': false,
                'onUpdate': (value) => {
                    SettingsHandler.setUserSetting('Swap Joysticks', value);
                },
                'getFromSource': () => {
                    let settings = SettingsHandler.getUserSettings();
                    return settings['Swap Joysticks'];
                },
            }));
        }
        this._setFields(fields);
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.SETTINGS_UPDATED, () => {
            for(let field of this._fields) {
                field.updateFromSource();
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.SETTINGS_UPDATED);
    }

    _onAdded() {
        this._addSubscriptions();
        for(let field of this._fields) {
            field.updateFromSource();
        }
        super._onAdded();
    }

    _onRemoved() {
        this._removeSubscriptions();
        super._onRemoved();
    }

}

export default UserSettingsPage;
