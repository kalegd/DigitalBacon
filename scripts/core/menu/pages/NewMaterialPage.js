/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const PAGES = [
    { "title": "Basic", "handlerFunction": "addBasicMaterial" },
    { "title": "Lambert", "handlerFunction": "addLambertMaterial" },
    { "title": "Normal", "handlerFunction": "addNormalMaterial" },
    { "title": "Phong", "handlerFunction": "addPhongMaterial" },
    { "title": "Standard", "handlerFunction": "addStandardMaterial" },
    { "title": "Toon", "handlerFunction": "addToonMaterial" },
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
        let material = MaterialsHandler[item.handlerFunction]();
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
