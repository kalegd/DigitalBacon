/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { FontSizes, Styles } from '/scripts/core/helpers/constants.js';
import { createTextInput, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/scripts/DigitalBacon-UI.js';

class TextInputPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = new Text(' ', Styles.bodyText, {
            marginTop: 0.01,
            maxWidth: 0.375,
        });
        this.add(this._titleBlock);

        let columnBlock = new Div({
            height: 0.2,
            justifyContent: 'center',
            width: 0.45,
        });
        this._textInput = createTextInput({
            borderRadius: 0.02,
            fontSize: FontSizes.body,
            height: 0.04,
            marginBottom: 0.004,
            marginTop: 0.01,
            width: 0.375,
        });
        this._textInput.onBlur = () => { global.keyboardLock = false; };
        this._textInput.onEnter = () => this._inputConfirmed();
        this._textInput.onFocus = () => { global.keyboardLock = true; };
        this._button = createWideButton('.');
        this._button.height = 0.04
        this._button.margin = 0.004;
        this._button.width = 0.25;
        this._button.onClickAndTouch = () => this._inputConfirmed();
        columnBlock.add(this._textInput);
        columnBlock.add(this._button);
        this.add(columnBlock);
    }

    _inputConfirmed() {
        this._textInput.blur();
        if(this._action) this._action(this._textInput.value);
    }

    setContent(title, defaultText, buttonText, action) {
        this._titleBlock.text = title;
        this._button.textComponent.text = buttonText;
        this._action = action;
        this._textInput.placeholder = defaultText;
        this._textInput.value = '';
    }

    setContentWithInitialValue(title, content, buttonText, action) {
        this._titleBlock.text = title;
        this._button.textComponent.text = buttonText;
        this._action = action;
        this._textInput.placeholder = '';
        this._textInput.value = content;
    }

    back() {
        this._textInput.blur();
        super.back();
    }

}

export default TextInputPage;
