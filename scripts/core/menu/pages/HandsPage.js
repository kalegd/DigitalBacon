/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import HandTools from '/scripts/core/enums/HandTools.js';
import ToolHandler from '/scripts/core/handlers/ToolHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const hands = [
    { "title": "Edit", "type": HandTools.EDIT },
    { "title": "Copy / Paste", "type": HandTools.COPY_PASTE },
    { "title": "Delete", "type": HandTools.DELETE },
    { "title": "Translate", "type": HandTools.TRANSLATE },
    { "title": "Rotate", "type": HandTools.ROTATE },
    { "title": "Scale", "type": HandTools.SCALE },
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
        if(HandTools.ACTIVE == item.type) return;
        HandTools.ACTIVE = item.type;
        ToolHandler.setTool(item.type);
    }

    _refreshItems() {

    }
}

export default HandsPage;
