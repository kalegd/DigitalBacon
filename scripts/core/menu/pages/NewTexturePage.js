/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

class NewTexturePage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._items = TexturesHandler.getTextureClasses();
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Add New Texture',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.3,
        });
        this._container.add(titleBlock);

        this._addList();
    }

    _getItemName(item) {
        return item.assetName;
    }

    _handleItemInteraction(item) {
        let texture = TexturesHandler.addNewTexture(item.assetId);
        this.back();
        if(this._additionalAction) this._additionalAction(texture);
    }

    _refreshItems() {
        this._items = TexturesHandler.getTextureClasses();
    }

    setContent(additionalAction) {
        this._additionalAction = additionalAction;
    }

}

export default NewTexturePage;
