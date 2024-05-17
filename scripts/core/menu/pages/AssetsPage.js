/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import PaginatedButtonsPage from '/scripts/core/menu/pages/PaginatedButtonsPage.js';
import { Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const FIELD_MAX_LENGTH = 25;

class AssetsPage extends PaginatedButtonsPage {
    constructor(controller, assetType) {
        super(controller, true);
        this._assetType = assetType;
        this._assets = {};
        this._items = Object.keys(this._assets);
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        let title = (this._assetType == "CUSTOM_ASSET")
            ? "Other Assets"
            : this._assetType[0] + this._assetType.slice(1).toLowerCase();
        let titleBlock = new Text(title, Styles.title);
        this.add(titleBlock);

        this._addList();
    }

    _createAddButton() {
        let addButton = createSmallButton('+');
        addButton.bypassContentPositioning = true;
        addButton.position.fromArray([0.175, 0.12, 0.001]);
        addButton.onClickAndTouch = () => {
            let page = this._controller.getPage('NEW_' + this._assetType);
            page.setContent((asset) => {
                if(asset.constructor.assetType == this._assetType)
                    this._handleItemInteraction(asset.id);
            });
            this._controller.pushPage('NEW_' + this._assetType);
        };
        this.add(addButton);
    }

    _getItemName(item) {
        let name = this._assets[item].name;
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleItemInteraction(item) {
        let assetPage = this._controller.getPage(this._assetType);
        assetPage.setAsset(this._assets[item]);
        this._controller.pushPage(this._assetType);
    }

    _refreshItems() {
        this._assets = ProjectHandler.getAssetsForType(this._assetType);
        this._items = Object.keys(this._assets);
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, this._assetType + '_ADDED', () => {
            this._refreshItems();
            this._updateItemsGUI();
        });
        PubSub.subscribe(this._id, this._assetType + '_UPDATED', () => {
            this._refreshItems();
            this._updateItemsGUI();
        });
        PubSub.subscribe(this._id, this._assetType + '_DELETED', () => {
            this._refreshItems();
            this._updateItemsGUI();
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._refreshItems();
            this._updateItemsGUI();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, this._assetType + '_ADDED');
        PubSub.unsubscribe(this._id, this._assetType + '_UPDATED');
        PubSub.unsubscribe(this._id, this._assetType + '_DELETED');
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

export default AssetsPage;
