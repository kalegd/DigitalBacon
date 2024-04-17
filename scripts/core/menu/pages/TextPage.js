/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Styles } from '/scripts/core/helpers/constants.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Text } from '/scripts/DigitalBacon-UI.js';

class TextPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = new Text('', Styles.title);
        this.add(this._titleBlock);

        this._textBlock = new Text('', Styles.bodyText, { maxWidth: 0.4 });
        this.add(this._textBlock);
    }

    setContent(title, text) {
        this._titleBlock.textComponent.text = title;
        this._textBlock.textComponent.text = text;
    }
}

export default TextPage;
