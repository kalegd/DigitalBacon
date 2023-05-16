/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts, FontSizes, euler, quaternion, vector3s } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class AssetPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._instances = {};
        this._items = Object.keys(this._instances);
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
        });
        this._container.add(this._titleBlock);

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
            this._controller
                .getPosition(vector3s[0]);
            this._controller
                .getDirection(vector3s[1]).normalize()
                .divideScalar(4);
            let position = vector3s[0].sub(vector3s[1]).toArray();
            vector3s[0].set(0, 0, 1);
            vector3s[1].setY(0).normalize();
            quaternion.setFromUnitVectors(vector3s[0], vector3s[1]);
            euler.setFromQuaternion(quaternion);
            let rotation = euler.toArray();
            let params = {
                assetId: this._assetId,
                position: position,
                rotation: rotation,
                visualEdit: true,
            };
            ProjectHandler.addNewAsset(this._assetId, params);
        });
        this._containerInteractable.addChild(interactable);
        this._object.add(addButtonParent);
    }

    _getItemName(item) {
        if(item == 'Acknowledgement') {
            return item;
        } else {
            return this._instances[item].getName();
        }
    }

    _handleItemInteraction(item) {
        if(item == 'Acknowledgement') {
            let page = this._controller.getPage(MenuPages.ACKNOWLEDGEMENTS);
            page.setAssets([LibraryHandler.library[this._assetId]]);
            this._controller.pushPage(MenuPages.ACKNOWLEDGEMENTS);
        } else {
            let instancePage = this._controller.getPage(MenuPages.INSTANCE);
            instancePage.setInstance(this._instances[item]);
            this._controller.pushPage(MenuPages.INSTANCE);
        }
    }

    _refreshItems() {
        this._instances = ProjectHandler.getInstancesForAssetId(this._assetId);
        this._items = Object.keys(this._instances);
        let asset = LibraryHandler.library[this._assetId];
        if(asset['Author']) {
            this._items.push('Acknowledgement');
        }
    }

    setAsset(assetId) {
        let asset = LibraryHandler.library[assetId];
        this._assetId = assetId;
        this._titleBlock.children[1].set({ content: asset['Name'] });
        this._instances = ProjectHandler.getInstancesForAssetId(assetId);
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ADDED, (instance) => {
            if(instance.getAssetId() == this._assetId) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_UPDATED, (message) => {
            if(message.asset.getAssetId() == this._assetId) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DELETED, (e) => {
            if(e.instance.getAssetId() == this._assetId &&
                    this._items.includes(e.instance.getId())) {
                this._refreshItems();
                this._updateItemsGUI();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._controller.back();
            this._controller.back();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_DELETED);
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

export default AssetPage;
