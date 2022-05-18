/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
//import ThreeMeshUI from 'three-mesh-ui';

class AssetPage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._instances = {};
        this._items = Object.keys(this._instances);
        this._addPageContent();
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

    _getItemName(item) {
        return this._instances[item].getName();
    }

    _handleItemInteraction(item) {
        let instancePage = this._controller.getPage(MenuPages.INSTANCE);
        instancePage.setInstance(this._instances[item]);
        this._controller.pushPage(MenuPages.INSTANCE);
    }

    _refreshItems() {
        this._items = Object.keys(this._instances);
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
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_UPDATED, (instance)=> {
            if(instance.getAssetId() == this._assetId) {
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
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_DELETED);
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
