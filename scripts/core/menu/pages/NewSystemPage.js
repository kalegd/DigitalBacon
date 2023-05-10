/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import SystemsHandler from '/scripts/core/handlers/SystemsHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

class NewSystemPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._items = SystemsHandler.getAssetClasses();
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Add New System',
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
        let system = SystemsHandler.addNewAsset(item.assetId);
        this.back();
        if(this._additionalAction) this._additionalAction(system);
    }

    _refreshItems() {
        this._items = SystemsHandler.getAssetClasses();
    }

    setContent(additionalAction) {
        this._additionalAction = additionalAction;
    }

}

export default NewSystemPage;
