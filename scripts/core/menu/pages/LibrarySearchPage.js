/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const FIELD_MAX_LENGTH = 25;

class LibrarySearchPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._assets = ProjectHandler.getAssets();
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
        let name = this._assets[item].getName();
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleItemInteraction(item) {
        let asset = this._assets[item];
        let assetType = LibraryHandler.getType(asset.getAssetId());
        let assetPage = this._controller.getPage(assetType);
        assetPage.setAsset(asset);
        this._controller.pushPage(assetType);
    }

    _refreshItems() {
        this._assets = ProjectHandler.getAssets();
        this._items = this._getFilteredItems();
    }

    _getFilteredItems() {
        let items = [];
        let content = this._textField.content.toLowerCase();
        for(let id in this._assets) {
            let asset = this._assets[id];
            if(asset instanceof InternalAssetEntity) {
                continue;
            } else if(asset.getName().toLowerCase().includes(content)) {
                items.push(id);
            } else {
                let assetId = asset.getAssetId();
                let assetName = LibraryHandler.getAssetName(assetId);
                if(assetName.toLowerCase().includes(content)) items.push(id);
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
