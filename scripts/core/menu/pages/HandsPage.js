/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import ToolHandler from '/scripts/core/handlers/ToolHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const hands = [
    { "title": "Edit", "type": InteractionTools.EDIT },
    { "title": "Copy / Paste", "type": InteractionTools.COPY_PASTE },
    { "title": "Delete", "type": InteractionTools.DELETE },
    { "title": "Translate", "type": InteractionTools.TRANSLATE },
    { "title": "Rotate", "type": InteractionTools.ROTATE },
    { "title": "Scale", "type": InteractionTools.SCALE },
];

class HandsPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._items = hands;
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Hand Tools',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

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
