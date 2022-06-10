/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const PAGES = [
    { "title": "Basic", "materialType": MaterialTypes.BASIC },
    { "title": "Lambert", "materialType": MaterialTypes.LAMBERT },
    { "title": "Normal", "materialType": MaterialTypes.NORMAL },
    { "title": "Phong", "materialType": MaterialTypes.PHONG },
    { "title": "Standard", "materialType": MaterialTypes.STANDARD },
    { "title": "Toon", "materialType": MaterialTypes.TOON },
];

class NewMaterialPage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._items = PAGES;
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Add New Material',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.3,
        });
        this._container.add(titleBlock);

        this._addList();
    }

    _getItemName(item) {
        return item['title'];
    }

    _handleItemInteraction(item) {
        let material = MaterialsHandler.addMaterial(item.materialType);
        this.back();
        if(this._additionalAction) this._additionalAction(material);
    }

    _refreshItems() {
        //Don't need to do anything as materials list is static
    }

    setContent(additionalAction) {
        this._additionalAction = additionalAction;
    }

}

export default NewMaterialPage;
