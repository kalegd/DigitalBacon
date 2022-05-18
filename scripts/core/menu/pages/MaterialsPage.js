/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const FIELD_MAX_LENGTH = 25;

class MaterialsPage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._materials = MaterialsHandler.getMaterials();
        this._items = Object.keys(this._materials);
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Materials',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        this._addList();
    }

    _createAddButton() {
        let addButtonParent = new ThreeMeshUI.Block({
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
        addButtonParent.set({ fontFamily: Fonts.defaultFamily, fontTexture: Fonts.defaultTexture });
        addButtonParent.position.fromArray([.175, 0.12, -0.001]);
        addButtonParent.add(addButton);
        let interactable = new PointerInteractable(addButton, () => {
            let page = this._controller.getPage(MenuPages.NEW_MATERIAL);
            page.setContent((material) => {
                this._handleItemInteraction(material.getId());
            });
            this._controller.pushPage(MenuPages.NEW_MATERIAL);
        });
        this._containerInteractable.addChild(interactable);
        this._object.add(addButtonParent);
    }

    _getItemName(item) {
        let name = this._materials[item].getName();
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleItemInteraction(item) {
        let materialPage = this._controller.getPage(MenuPages.MATERIAL);
        materialPage.setMaterial(this._materials[item]);
        this._controller.pushPage(MenuPages.MATERIAL);
    }

    _refreshItems() {
        this._materials = MaterialsHandler.getMaterials();
        this._items = Object.keys(this._materials);
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_ADDED, (material) => {
            this._refreshItems();
            this._updateItemsGUI();
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_UPDATED, (instance)=> {
            this._refreshItems();
            this._updateItemsGUI();
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (e) => {
            this._refreshItems();
            this._updateItemsGUI();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_DELETED);
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

export default MaterialsPage;
