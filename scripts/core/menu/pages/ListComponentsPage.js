/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ComponentsHandler from '/scripts/core/handlers/assetTypes/ComponentsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import PaginatedListPage from '/scripts/core/menu/pages/PaginatedListPage.js';
import { Text } from '/scripts/DigitalBacon-UI.js';

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
        let titleBlock = new Text('Components', Styles.title);
        this.add(titleBlock);

        this._addList();
    }

    _createAddButton() {
        let addButton = createSmallButton('+');
        addButton.bypassContentPositioning = true;
        addButton.position.fromArray([0.175, 0.12, 0.001]);
        addButton.onClickAndTouch = () => {
            let assetComponents = this._asset.getComponents(true);
            let components = ComponentsHandler.getAssets();
            let filteredComponents = {};
            for(let componentId in components) {
                let component = components[componentId];
                if(!assetComponents.has(component)
                        && component.supports(this._asset)) {
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
        };
        this.add(addButton);
    }

    _addComponent(componentId) {
        this._asset.editorHelper.addComponent(componentId);
        this._controller.back();
    }

    _selectNewComponent() {
        let currentPage = this._controller.getCurrentPage();
        let page = this._controller.getPage(MenuPages.NEW_COMPONENT);
        page.setContent((component) => {
            if(!component.supports(this._asset)) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'Component is not supported for this type of asset',
                });
                return;
            }
            this._asset.editorHelper.addComponent(component.getId());
            if(currentPage != this._controller.getCurrentPage()) return;
            this._controller.back();
            let componentPage = this._controller.getPage(MenuPages.COMPONENT);
            componentPage.setAsset(component);
            this._controller.pushPage(MenuPages.COMPONENT);
        });
        this._controller.pushPage(MenuPages.NEW_COMPONENT);
    }

    _getItemName(item) {
        let name = item.getName();
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleEditItemInteraction(item) {
        let componentPage = this._controller.getPage(MenuPages.COMPONENT);
        componentPage.setAsset(item);
        this._controller.pushPage(MenuPages.COMPONENT);
    }

    _handleDeleteItemInteraction(item) {
        this._asset.editorHelper.removeComponent(item.getId());
    }

    _refreshItems() {
        this._items = Array.from(this._asset.getComponents(true));
    }

    setContent(asset) {
        this._asset = asset;
        this._items = Array.from(asset.getComponents(true));
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
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ADDED, (component) =>{
            if(this._asset.getComponents(true).has(component)) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DELETED, (message) =>{
            if(this._items.includes(message.asset)) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_UPDATED, (message)=>{
            for(let field of message.fields) {
                if(field == 'name') {
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
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.PROJECT_LOADING);
    }

    _onAdded() {
        this._addSubscriptions();
        super._onAdded();
    }

    _onRemoved() {
        this._removeSubscriptions();
        super._onRemoved();
    }

}

export default ListComponentsPage;
