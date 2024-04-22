/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton, createTextInput } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import { Span } from '/scripts/DigitalBacon-UI.js';

class AssetPage extends DynamicFieldsPage {
    constructor(controller, assetType) {
        super(controller, true);
        this._assetType = assetType;
    }

    _createTitleBlock() {
        this._titleBlock = new Span({
            height: 0.04,
            justifyContent: 'spaceBetween',
            margin: 0.01,
            width: 0.39,
        });
        this._titleField = createTextInput({
            borderRadius: 0.02,
            fontSize: FontSizes.body,
            height: 0.04,
            width: 0.29,
        });
        this._titleField.onBlur = () => {
            global.keyboardLock = false;
            this._asset.editorHelper.updateName(this._titleField.value);
        };
        this._titleField.onEnter = () => this._titleField.blur();
        this._titleField.onFocus = () => { global.keyboardLock = true; };
        let componentsButton = createSmallButton(Textures.componentIcon, 0.7);
        let deleteButton = createSmallButton(Textures.trashIcon, 0.7);
        this._titleBlock.add(componentsButton);
        this._titleBlock.add(this._titleField);
        this._titleBlock.add(deleteButton);
        componentsButton.onClickAndTouch = () => {
            let page = this._controller.getPage(MenuPages.LIST_COMPONENTS);
            page.setContent(this._asset);
            this._controller.pushPage(MenuPages.LIST_COMPONENTS);
        };
        deleteButton.onClickAndTouch =
            () => ProjectHandler.deleteAsset(this._asset);
    }

    setAsset(asset) {
        this._asset = asset;
        let name = asset.getName();
        this._titleField.value = name;
        this._setFields(asset.editorHelper.getMenuFields());
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, this._assetType + '_DELETED', (e) => {
            if(e.asset == this._asset) {
                this._controller.popPagesPast(this._assetType);
            }
        });
        PubSub.subscribe(this._id, this._assetType + '_UPDATED', (message) => {
            if(message.asset == this._asset) {
                this._titleField.value = message.asset.getName();
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._removeSubscriptions();
            this._controller.setPage(MenuPages.NAVIGATION);
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, this._assetType + '_DELETED');
        PubSub.unsubscribe(this._id, this._assetType + '_UPDATED');
        PubSub.unsubscribe(this._id, PubSubTopics.PROJECT_LOADING);
    }

    back() {
        this._removeCurrentFields();
        this._removeSubscriptions();
        super.back();
    }

    _onAdded() {
        this._addSubscriptions();
        super._onAdded();
    }
}

export default AssetPage;
