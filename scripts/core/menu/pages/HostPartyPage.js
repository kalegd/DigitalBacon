/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Party from '/scripts/core/clients/Party.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class HostPartyPage extends MenuPage {
    constructor(controller) {
        super(controller, false, true);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Host Party',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });
        this._textField = new TextField({
            'height': 0.03,
            'width': 0.4,
            'text': 'Party Name',
            'onEnter': () => { this._textField.deactivate(); },
        });
        this._textField.addToScene(columnBlock,
            this._containerInteractable);
        let button = ThreeMeshUIHelper.createButtonBlock({
            'text': "Submit",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.2,
            'margin': 0.002,
        });
        columnBlock.add(button);
        let interactable = new PointerInteractable(button, () => {
            this._hostParty();
        });
        this._containerInteractable.addChild(interactable);
        this._container.add(columnBlock);
    }

    clearContent() {
        this._textField.reset();
    }

    _inputConfirmed(textField) {
        this._textField.deactivate();
    }

    _hostParty() {
        console.log("TODO: Validate fields and then host party");
        Party.host("testRoomId", () => { this._successCallback(); },
            () => { this._errorCallback(); });
    }

    _successCallback() {
        console.log("TODO: Handle success callback");
    }

    _errorCallback() {
        console.log("TODO: Handle error callback");
    }

}

export default HostPartyPage;
