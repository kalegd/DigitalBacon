/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const FIELD_MAX_LENGTH = 25;

class LibrarySearchPage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._assets = LibraryHandler.getLibrary();
        this._items = Object.keys(this._assets);
        this._addPageContent();
    }

    _addPageContent() {
        this._textField = new TextField({
            'height': 0.04,
            'width': 0.4,
            'fontSize': FontSizes.header,
            'onBlur': () => { this._searchUpdated(); },
            'onUpdate': () => { this._searchUpdated(); },
        });
        this._textField.addToScene(this._container,this._containerInteractable);

        this._addList();
    }

    _searchUpdated() {
        this._refreshItems();
        this._updateItemsGUI();
    }

    _getItemName(item) {
        let name = this._assets[item]['Name'];
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleItemInteraction(item) {
        let assetPage = this._controller.getPage(MenuPages.ASSET);
        assetPage.setAsset(item);
        this._controller.pushPage(MenuPages.ASSET);
    }

    _refreshItems() {
        this._assets = LibraryHandler.getLibrary();
        this._items = this._getFilteredItems();
    }

    _getFilteredItems() {
        let items = [];
        let content = this._textField.content.toLowerCase();
        for(let assetId in this._assets) {
            if(this._assets[assetId]['Name'].toLowerCase().includes(content)) {
                items.push(assetId);
            } else {
                let instances = ProjectHandler.getInstancesForAssetId(assetId);
                for(let instanceId in instances) {
                    if(instances[instanceId].getName().toLowerCase()
                            .includes(content)) {
                        items.push(assetId);
                        break;
                    }
                }
            }
        }
        return items;
    }

    back() {
        this._textField.deactivate();
        super.back();
    }

}

export default LibrarySearchPage;
