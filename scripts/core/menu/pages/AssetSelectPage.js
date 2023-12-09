/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import { Colors, Fonts } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const FIELD_MAX_LENGTH = 25;

class AssetSelectPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._assets = {};
        this._items = Object.keys(this._assets);
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        this._textField = new TextField({
            'height': 0.04,
            'width': 0.3,
            'onBlur': () => { this._searchUpdated(); },
            'onUpdate': () => { this._searchUpdated(); },
        });
        this._textField.addToScene(this._container,this._containerInteractable);

        this._addList();
    }

    _createAddButton() {
        let addButtonParent = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.06,
            backgroundColor: Colors.defaultMenuBackground,
            backgroundOpacity: 0,
        });
        this._addButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "+",
            'fontSize': 0.04,
            'height': 0.04,
            'width': 0.04,
        });
        addButtonParent.set({
            fontFamily: Fonts.defaultFamily,
            fontTexture: Fonts.defaultTexture,
        });
        addButtonParent.position.fromArray([.175, 0.12, -0.001]);
        addButtonParent.add(this._addButton);
        this._addInteractable = new PointerInteractable(this._addButton, true);
        this._addInteractable.addAction(() => {
            if(this._addAction) this._addAction();
        });
        this._containerInteractable.addChild(this._addInteractable);
        this._object.add(addButtonParent);
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
        let content = this._textField.content.toLowerCase();
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
            this._addButton.visible = true;
            this._containerInteractable.addChild(this._addInteractable);
        } else {
            this._addButton.visible = false;
            this._containerInteractable.removeChild(this._addInteractable);
        }
    }

    back() {
        this._action = null;
        this._textField.deactivate();
        if(this._backAction) this._backAction();
        super.back();
    }

}

export default AssetSelectPage;
