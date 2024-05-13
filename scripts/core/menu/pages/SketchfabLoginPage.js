/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import CheckboxField from '/scripts/core/menu/input/CheckboxField.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { DelayedClickHandler, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class SketchfabLoginPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._staySignedIn = false;
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Login to Sketchfab', Styles.title);
        this.add(titleBlock);

        let staySignedInCheckbox = new CheckboxField({
            'title': 'Stay signed in on this device',
            'titleWidth': 0.27,
            'initialValue': false,
            'swapOrder': true,
            'onUpdate': (value) => {
                this._staySignedIn = value;
            },
            'getFromSource': () => this._staySignedIn,
        });
        this.add(staySignedInCheckbox);
        let loginButton = createWideButton('Login');
        loginButton.height = 0.04
        loginButton.margin = 0.004;
        loginButton.width = 0.25;
        this.add(loginButton);
        loginButton.onClickAndTouch = () => {
            if(global.deviceType == 'XR') {
                SessionHandler.exitXRSession();
                this._handleLogin();
            } else {
                DelayedClickHandler.trigger(() => this._handleLogin());
            }
        };
    }

    _handleLogin() {
        Sketchfab.signIn(this._staySignedIn,
            () => { this._handleLoginCallback(); });
    }

    _handleLoginCallback() {
        this._controller.popPage();
        this._controller.pushPage(MenuPages.SKETCHFAB_SEARCH);
    }
}

export default SketchfabLoginPage;
