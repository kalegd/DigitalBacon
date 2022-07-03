/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const FIELD_MAX_LENGTH = 25;

class LightsPage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._assets = {};
        this._items = Object.keys(this._assets);
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(this._titleBlock);

        this._addList();
    }

    _createAddButton() {
        this._addButtonParent = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.06,
            backgroundColor: Colors.defaultMenuBackground,
            backgroundOpacity: 0,
        });
        let addButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "+",
            'fontSize': 0.04,
            'height': 0.04,
            'width': 0.04,
        });
        this._addButtonParent.set({ fontFamily: Fonts.defaultFamily, fontTexture: Fonts.defaultTexture });
        this._addButtonParent.position.fromArray([.175, 0.12, -0.001]);
        this._addButtonParent.add(addButton);
        this._addInteractable = new PointerInteractable(addButton, () => {
            this._controller.pushPage(MenuPages.UPLOAD);
        });
        this._containerInteractable.addChild(this._addInteractable);
        this._object.add(this._addButtonParent);
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
        let library = LibraryHandler.getLibrary();
        for(let assetId in library) {
            if(library[assetId]['Type'] == this._assetType) {
                this._assets[assetId] = library[assetId];
            }
        }
        this._items = Object.keys(this._assets);
    }

    setContent(assetType, title) {
        this._assets = {};
        this._assetType = assetType;
        if(assetType == AssetTypes.MODEL || assetType == AssetTypes.IMAGE) {
            this._object.add(this._addButtonParent);
            this._containerInteractable.addChild(this._addInteractable);
        } else {
            this._object.remove(this._addButtonParent);
            this._containerInteractable.removeChild(this._addInteractable);
        }
        this._titleBlock.children[1].set({ content: title });
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.ASSET_ADDED, (assetId) => {
            if(LibraryHandler.getType(assetId) == this._assetType) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._refreshItems();
            this._updateItemsGUI();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.ASSET_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.PROJECT_LOADING);
    }

    addToScene(scene, parentInteractable) {
        this._addSubscriptions();
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        this._removeSubscriptions();
        super.removeFromScene();
    }

}

export default LightsPage;
