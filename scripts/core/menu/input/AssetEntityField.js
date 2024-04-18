/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import Scene from '/scripts/core/assets/Scene.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span, Text } from '/scripts/DigitalBacon-UI.js';

class AssetEntityField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        this._exclude =  params['exclude'];
        this._filter =  params['filter'];
        this._includeScene =  params['includeScene'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateAssetEntity(this._lastValue);
    }

    _createInputs(title) {
        this._addTitle(title);
        this._assetEntitySelection = createWideButton('');
        this._assetEntitySelection.textComponent.fontSize = 0.017;
        this._assetEntitySelection.height = 0.03;
        this._assetEntitySelection.width = 0.17;
        this._updateAssetEntity();
        this.add(this._assetEntitySelection);
        this._assetEntitySelection.onClick = () => {
            let assets = ProjectHandler.getAssets();
            let filteredAssets = {};
            filteredAssets["null\n"] = { Name: "Blank" };
            if(this._includeScene)
                filteredAssets[Scene.getId()] = { Name: 'Scene' };
            for(let assetId in assets) {
                if(this._exclude == assetId) continue;
                let asset = assets[assetId];
                if(asset instanceof InternalAssetEntity) continue;
                if(asset instanceof AssetEntity) {
                    if(this._filter && !this._filter(asset)) continue;
                    filteredAssets[assetId] = { Name: asset.getName() };
                }
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredAssets, (assetId) => {
                if(assetId == "null\n") assetId = null;
                this._handleAssetSelection(assetId);
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        };
    }

    _handleAssetSelection(assetId) {
        if(assetId == "null\n") {
            assetId = null;
        }
        if(this._lastValue != assetId) {
            if(this._onUpdate) this._onUpdate(assetId);
            this._updateAssetEntity(assetId);
        }
        global.menuController.back();
    }

    _updateAssetEntity(assetId) {
        this._lastValue = assetId;
        let assetEntity = ProjectHandler.getAsset(this._lastValue);
        let assetEntityName = assetEntity
            ? assetEntity.getName()
            : Scene.getId() == this._lastValue ? 'Scene' : " ";
        assetEntityName = stringWithMaxLength(assetEntityName, 16);
        this._assetEntitySelection.textComponent.text = assetEntityName;
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let assetEntity = this._getFromSource();
        if(this._lastValue != assetEntity) this._updateAssetEntity(assetEntity);
    }
}

export default AssetEntityField;
