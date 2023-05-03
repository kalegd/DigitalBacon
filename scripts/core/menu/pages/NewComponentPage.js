/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

class NewComponentPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._items = ComponentsHandler.getComponentClasses();
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Add New Component',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
        });
        this._container.add(titleBlock);

        this._addList();
    }

    _getItemName(item) {
        return item.assetName;
    }

    _handleItemInteraction(item) {
        let component = ComponentsHandler.addNewComponent(item.assetId);
        this.back();
        if(this._additionalAction) this._additionalAction(component);
    }

    _refreshItems() {
        this._items = ComponentsHandler.getComponentClasses();
    }

    setContent(additionalAction) {
        this._additionalAction = additionalAction;
    }

}

export default NewComponentPage;
