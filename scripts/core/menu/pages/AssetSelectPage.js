/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PaginatedButtonsPage from '/scripts/core/menu/pages/PaginatedButtonsPage.js';
import { createTextInput, createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';

const FIELD_MAX_LENGTH = 25;

class AssetSelectPage extends PaginatedButtonsPage {
    constructor(controller) {
        super(controller, true);
        this._assets = {};
        this._items = Object.keys(this._assets);
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        this._searchInput = createTextInput({
            borderRadius: 0.02,
            fontSize: FontSizes.body,
            height: 0.04,
            marginBottom: 0.004,
            marginTop: 0.01,
            width: 0.29,
        });
        this._searchInput.onBlur = () => {
            global.keyboardLock = false;
            this._searchUpdated();
        };
        this._searchInput.onChange = () => this._searchUpdated();
        this._searchInput.onEnter = () => this._searchInput.blur();
        this._searchInput.onFocus = () => { global.keyboardLock = true; };
        this.add(this._searchInput);

        this._addList();
    }

    _createAddButton() {
        this._addButton = createSmallButton('+');
        this._addButton.bypassContentPositioning = true;
        this._addButton.position.fromArray([0.175, 0.12, 0.001]);
        this._addButton.onClickAndTouch = () => {
            if(this._addAction) this._addAction();
        };
        this.add(this._addButton);
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
        if(this._action) this._action(item);
    }

    _refreshItems() {
        this._items = this._getFilteredItems();
    }

    _getFilteredItems() {
        let items = [];
        let content = this._searchInput.value.toLowerCase();
        for(let assetId in this._assets) {
            if(this._assets[assetId]['Name'].toLowerCase().includes(content)) {
                items.push(assetId);
            }
        }
        return items;
    }

    setContent(assets, action, addAction, backAction) {
        this._assets = assets;
        this._action = action;
        this._addAction = addAction;
        this._backAction = backAction;
        if(this._addAction) {
            if(!this._addButton.parent) {
                this.add(this._addButton);
            }
        } else if(this._addButton.parentComponent) {
            this.remove(this._addButton);
        }
    }

    back() {
        this._action = null;
        this._searchInput.blur();
        if(this._backAction) this._backAction();
        super.back();
    }

}

export default AssetSelectPage;
