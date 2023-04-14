/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class SketchfabLoginPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._staySignedIn = false;
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Login to Sketchfab',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.3,
        });
        this._container.add(titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'margin': 0.03,
        });

        let staySignedInCheckbox = new CheckboxInput({
            'title': 'Stay signed in on this device',
            'titleWidth': 0.27,
            'initialValue': false,
            'swapOrder': true,
            'onUpdate': (value) => {
                this._staySignedIn = value;
            },
            'getFromSource': () => {
                return this._staySignedIn;
            },
        });
        staySignedInCheckbox.addToScene(columnBlock,
            this._containerInteractable);
        let loginButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "Login",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
        });
        columnBlock.add(loginButton);
        let interactable = new PointerInteractable(loginButton, () => {
            if(global.deviceType == 'XR') SessionHandler.exitXRSession();
            Sketchfab.signIn(this._staySignedIn,
                () => { this._handleLoginCallback() });
        });
        this._containerInteractable.addChild(interactable);
        this._container.add(columnBlock);
    }

    _handleLoginCallback() {
        this._controller.popPage();
        this._controller.pushPage(MenuPages.SKETCHFAB_SEARCH);
    }
}

export default SketchfabLoginPage;
