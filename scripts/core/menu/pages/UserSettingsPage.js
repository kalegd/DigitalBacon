/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';

class UserSettingsPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller, false, true);
        this._createFields();
    }

    _createTitleBlock() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'User Settings',
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
                SettingsHandler.setUserSetting('Movement Speed', newValue);
            },
            'getFromSource': () => {
                return SettingsHandler.getUserSettings()['Movement Speed'];
            },
        }));
        fields.push(new CheckboxInput({
            'title': 'Enable Flying',
            'initialValue': true,
            'onUpdate': (value) => {
                SettingsHandler.setUserSetting('Enable Flying', value);
            },
            'getFromSource': () => {
                return SettingsHandler.getUserSettings()['Enable Flying'];
            },
        }));
        this._setFields(fields);
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.SETTINGS_UPDATED, (message) => {
            for(let field of this._fields) {
                field.updateFromSource();
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.SETTINGS_UPDATED);
    }

    addToScene(scene, parentInteractable) {
        this._addSubscriptions();
        for(let field of this._fields) {
            field.updateFromSource();
        }
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        this._removeSubscriptions();
        super.removeFromScene();
    }

}

export default UserSettingsPage;
