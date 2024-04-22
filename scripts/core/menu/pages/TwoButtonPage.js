/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Styles } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/scripts/DigitalBacon-UI.js';

class TwoButtonPage extends MenuPage {
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
        this._button1 = createWideButton('.');
        this._button2 = createWideButton(' ');
        this._button1.height = this._button2.height = 0.04
        this._button1.margin = this._button2.margin = 0.004;
        this._button1.width = this._button2.width = 0.25;
        this._button1.onClickAndTouch =
            () => { if(this._action1) this._action1(); };
        this._button2.onClickAndTouch =
            () => { if(this._action2) this._action2(); };
        columnBlock.add(this._button1);
        columnBlock.add(this._button2);
        this.add(columnBlock);
    }

    setContent(title, button1Text, button2Text, action1, action2) {
        this._titleBlock.text = title;
        this._button1.textComponent.text = button1Text;
        this._button2.textComponent.text = button2Text;
        this._action1 = action1;
        this._action2 = action2;
    }
}

export default TwoButtonPage;
