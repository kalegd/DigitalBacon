/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { Colors, Textures } from '/scripts/core/helpers/constants.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import { Body, Style } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const BODY_STYLE = new Style({
    borderRadius: 0.01,
    borderWidth: 0.001,
    height: 0.3,
    materialColor: Colors.defaultMenuBackground,
    opacity: 0.7,
    width: 0.45,
});

class MenuPage extends Body {
    constructor(controller, hasBackButton) {
        super(BODY_STYLE);
        this._id = uuidv4();
        this._controller = controller;
        this._createCloseButton();
        this._updateMaterialOffset(100);
        if(hasBackButton) this._createBackButton();
        if(global.deviceType == 'XR') this.onClick = () => {};
    }

    _createBackButton() {
        let backButton = createSmallButton('<');
        backButton.bypassContentPositioning = true;
        backButton.position.fromArray([-.225, 0.15, 0.001]);
        backButton.onClickAndTouch = () => this.back();
        backButton._updateMaterialOffset(100);
        this.add(backButton);
        this._createHomeButton();
    }

    _createHomeButton() {
        let homeButton = createSmallButton(Textures.homeIcon, 0.9);
        homeButton.bypassContentPositioning = true;
        homeButton.position.fromArray([-.225, 0.1, 0.001]);
        homeButton.onClickAndTouch = () => this._controller.popAllPages();
        homeButton._updateMaterialOffset(100);
        this.add(homeButton);
    }

    _createCloseButton() {
        let closeButton = createSmallButton('X');
        closeButton.bypassContentPositioning = true;
        closeButton.position.fromArray([.225, 0.15, 0.001]);
        closeButton.onClickAndTouch = () => this._controller.closeMenu();
        closeButton._updateMaterialOffset(100);
        this.add(closeButton);
    }

    //Can be overwritten to add functionality to back button being pressed
    back() {
        this._controller.popPage();
    }

}

export default MenuPage;
