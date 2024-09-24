/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import PaginatedListPage from '/scripts/core/menu/pages/PaginatedListPage.js';
import { Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const FIELD_MAX_LENGTH = 25;

class AssetSetPage extends PaginatedListPage {
    constructor(controller) {
        super(controller, true);
        this._asset;
        this._items = [];
        this._addPageContent();
        this._createAddButton();
    }

    _addPageContent() {
        this._titleBlock = new Text('', Styles.title);
        this.add(this._titleBlock);

        this._addList();
    }

    _createAddButton() {
        let addButton = createSmallButton('+');
        addButton.bypassContentPositioning = true;
        addButton.position.fromArray([0.175, 0.12, 0.001]);
        addButton.onClickAndTouch = () => {
            let assets = {};
            let hasOptions = false;
            if(this._options) {
                for(let assetId of this._options) {
                    let asset = ProjectHandler.getAsset(assetId);
                    if(!asset) continue;
                    hasOptions = true;
                    assets[assetId] = { Name: asset.name };
                }
            }
            if(!hasOptions) {
                this._selectNewAsset();
            } else {
                let page = this._controller.getPage(MenuPages.ASSET_SELECT);
                page.setContent(assets, (assetId) => {
                    if(this._onAdd) this._onAdd(assetId);
                    this._controller.back();
                }, () => {
                    this._selectNewAsset();
                });
                this._controller.pushPage(MenuPages.ASSET_SELECT);
            }
        };
        addButton._updateMaterialOffset(100);
        this.add(addButton);
    }

    _selectNewAsset() {
        if(!this._newOptions) return;
        let currentPage = this._controller.getCurrentPage();
        let page = this._controller.getPage(MenuPages.NEW_ASSET);
        page.setContent(null, (asset) => {
            if(this._onAdd) this._onAdd(asset.id);
            if(currentPage != this._controller.getCurrentPage()) return;
            this._controller.back();
            let assetType = asset.constructor.assetType;
            let assetPage = this._controller.getPage(assetType);
            if(!assetPage) return;
            assetPage.setAsset(asset);
            this._controller.pushPage(assetType);
        }, this._newOptions);
        this._controller.pushPage(MenuPages.NEW_ASSET);
    }

    _getItemName(item) {
        let name = item.name;
        if(name.length > FIELD_MAX_LENGTH)
            name = "..." + name.substring(name.length - FIELD_MAX_LENGTH);
        return name;
    }

    _handleEditItemInteraction(item) {
        let assetType = item.constructor.assetType;
        let assetPage = this._controller.getPage(assetType);
        assetPage.setAsset(item);
        this._controller.pushPage(assetType);
    }

    _handleDeleteItemInteraction(item) {
        if(this._onRemove) this._onRemove(item.id);
    }

    _refreshItems() {
        this._items = this._getAssetSet();
    }

    setContent(title, getAssetSet, options, newOptions, onAdd, onRemove) {
        this._titleBlock.text = title;
        this._getAssetSet = getAssetSet
            ? () => Array.from(getAssetSet())
            : () => [];
        this._options = options;
        this._newOptions = newOptions;
        this._onAdd = onAdd;
        this._onRemove = onRemove;
        this._items = this._getAssetSet();
        this._page = 0;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._controller.setPage(MenuPages.NAVIGATION);
        });
    }

    _removeSubscriptions() {
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

export default AssetSetPage;
