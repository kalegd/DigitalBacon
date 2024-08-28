/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import PaginatedButtonsPage from '/scripts/core/menu/pages/PaginatedButtonsPage.js';
import { InteractionToolHandler, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const hands = [
    { "title": "Edit", "type": InteractionTools.EDIT },
    { "title": "Copy / Paste", "type": InteractionTools.COPY_PASTE },
    { "title": "Delete", "type": InteractionTools.DELETE },
    { "title": "Place", "type": InteractionTools.PLACE },
    { "title": "Translate", "type": InteractionTools.TRANSLATE },
    { "title": "Rotate", "type": InteractionTools.ROTATE },
    { "title": "Scale", "type": InteractionTools.SCALE },
];

class HandsPage extends PaginatedButtonsPage {
    constructor(controller) {
        super(controller, true);
        this._items = hands;
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Hand Tools', Styles.title);
        this.add(titleBlock);

        this._addList();
    }

    _getItemName(item) {
        return item.title;
    }

    _handleItemInteraction(item) {
        if(InteractionToolHandler.getTool() == item.type) return;
        InteractionToolHandler.setTool(item.type);
    }

    _refreshItems() {

    }
}

export default HandsPage;
