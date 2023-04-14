/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class TextInputPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
        });
        this._container.add(this._titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });
        this._textField = new TextField({
            'height': 0.04,
            'width': 0.4,
            'onEnter': () => { this._inputConfirmed(); },
        });
        this._button = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': 0.04,
            'width': 0.25,
            'margin': 0.002,
        });
        let buttonInteractable = new PointerInteractable(this._button, () => {
            this._inputConfirmed();
        });
        this._textField.addToScene(columnBlock, this._containerInteractable);
        columnBlock.add(this._button);
        this._container.add(columnBlock);
        this._containerInteractable.addChild(buttonInteractable);
    }

    _inputConfirmed() {
        this._textField.deactivate();
        if(this._action) this._action(this._textField.content);
    }

    setContent(title, defaultText, buttonText, action) {
        this._titleBlock.children[1].set({ content: title });
        this._button.children[1].set({ content: buttonText });
        this._action = action;
        this._textField.setDefaultContent(defaultText);
        this._textField.reset();
    }

    setContentWithInitialValue(title, content, buttonText, action) {
        this._titleBlock.children[1].set({ content: title });
        this._button.children[1].set({ content: buttonText });
        this._action = action;
        this._textField.setContent(content);
    }

    back() {
        this._textField.deactivate();
        super.back();
    }

}

export default TextInputPage;
