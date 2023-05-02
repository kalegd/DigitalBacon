/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedListPage from '/scripts/core/menu/pages/PaginatedListPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const FIELD_MAX_LENGTH = 25;

class ListComponentsPage extends PaginatedListPage {
    constructor(controller) {
        super(controller, true);
        this._asset;
        this._items = [];
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Components',
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
            let assetComponents = this._asset.getComponents();
            let components = ComponentsHandler.getComponents();
            let filteredComponents = {};
            for(let componentId in components) {
                let component = components[componentId];
                if(!assetComponents.has(component)) {
                    filteredComponents[componentId] =
                        { Name: component.getName() };
                }
            }
            let page = this._controller.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredComponents, (componentId) => {
                this._addComponent(componentId);
            }, () => {
                this._selectNewComponent();
            });
            this._controller.pushPage(MenuPages.ASSET_SELECT);

        });
        this._containerInteractable.addChild(this._addInteractable);
        this._object.add(this._addButtonParent);
    }

    _addComponent(componentId) {
        this._asset.editorHelper.addComponent(componentId);
        this._controller.back();
    }

    _selectNewComponent() {
        console.log("TODO: Have user select a new component to create");
    }

    _getItemName(item) {
        let name = item.getName();
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleEditItemInteraction(item) {
        let componentPage = this._controller.getPage(MenuPages.COMPONENT);
        componentPage.setComponent(item);
        this._controller.pushPage(MenuPages.COMPONENT);
    }

    _handleDeleteItemInteraction(item) {
        this._asset.editorHelper.removeComponent(item.getId());
    }

    _refreshItems() {
        this._items = Array.from(this._asset.getComponents());
    }

    setContent(asset) {
        this._asset = asset;
        this._items = Array.from(asset.getComponents());
        this._page = 0;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ATTACHED, (message)=>{
            if(message.id == this._asset.getId()) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DETACHED, (message)=>{
            if(message.id == this._asset.getId()) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_UPDATED, (message)=>{
            for(let field of message.fields) {
                if(field == 'name') {
                    console.log("Updating UI");
                    this._refreshItems();
                    this._updateItemsGUI();
                    break;
                }
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._controller.setPage(MenuPages.NAVIGATION);
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_ATTACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_DETACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_UPDATED);
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

export default ListComponentsPage;
