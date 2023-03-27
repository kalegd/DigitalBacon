/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';

class EditorSettingsPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller, false, true);
        this._createFields();
    }

    _createTitleBlock() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Editor Settings',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.3,
        });
    }

    _createFields() {
        let fields = [];
        fields.push(new NumberInput({
            'title': 'Movement Speed',
            'minValue': 0,
            'maxValue': 1000,
            'initialValue': 4,
            'onBlur': (oldValue, newValue) => {
                SettingsHandler.setEditorSetting('Movement Speed', newValue);
            },
            'getFromSource': () => {
                return SettingsHandler.getEditorSettings()['Movement Speed'];
            },
        }));
        fields.push(new NumberInput({
            'title': 'User Scale',
            'minValue': 0.001,
            'maxValue': 1000,
            'initialValue': 1,
            'onBlur': (oldValue, newValue) => {
                PubSub.publish(this._id, PubSubTopics.USER_SCALE_UPDATED,
                    newValue);
                SettingsHandler.setEditorSetting('User Scale', newValue);
            },
            'getFromSource': () => {
                return SettingsHandler.getEditorSettings()['User Scale'];
            },
        }));
        fields.push(new CheckboxInput({
            'title': 'Enable Flying',
            'initialValue': true,
            'onUpdate': (value) => {
                SettingsHandler.setEditorSetting('Enable Flying', value);
            },
            'getFromSource': () => {
                return SettingsHandler.getEditorSettings()['Enable Flying'];
            },
        }));
        if(global.deviceType == "XR") {
            fields.push(new CheckboxInput({
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

    addToScene(scene, parentInteractable) {
        for(let field of this._fields) {
            field.updateFromSource();
        }
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        super.removeFromScene();
    }

}

export default EditorSettingsPage;
