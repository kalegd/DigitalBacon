/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';

class TextPage extends MenuPage {
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

        this._textBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Loading...',
            'fontSize': 0.025,
            'height': 0.04,
            'width': 0.4,
        });
        this._container.add(this._textBlock);
    }

    setContent(title, text) {
        this._titleBlock.children[1].set({ content: title });
        this._textBlock.children[1].set({ content: text });
    }
}

export default TextPage;
