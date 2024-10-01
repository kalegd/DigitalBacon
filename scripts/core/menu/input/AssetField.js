/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import Scene from '/scripts/core/assets/Scene.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Textures } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createSmallButton, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class AssetField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue = params['initialValue'];
        this._exclude = params['exclude'];
        this._filter = params['filter'];
        this._privateIds = params['privateIds'] || new Set();
        this._includeScene =  params['includeScene'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateAsset(this._lastValue);
    }

    _createInputs(title) {
        this._addTitle(title);
        this._buttonsSpan = new Span({ height: 0.03, width: 0.17 });
        this._assetSelection = createWideButton('');
        this._assetSelection.textComponent.fontSize = 0.017;
        this._assetSelection.height = 0.03;
        this._assetSelection.width = 0.13;
        this._editButton = createSmallButton(Textures.pencilIcon);
        this._editButton.marginLeft = 0.01;
        this._editButton.height = 0.03;
        this._editButton.width = 0.03;
        this._buttonsSpan.add(this._assetSelection);
        this._buttonsSpan.add(this._editButton);
        this._updateAsset();
        this.add(this._buttonsSpan);
        this._assetSelection.onClickAndTouch = () => {
            let assets = ProjectHandler.getAssets();
            let filteredAssets = {};
            filteredAssets["null\n"] = { Name: "Blank" };
            if(this._includeScene)
                filteredAssets[Scene.id] = { Name: 'Scene' };
            for(let assetId in assets) {
                if(this._exclude == assetId) continue;
                let asset = assets[assetId];
                if(asset instanceof InternalAssetEntity) continue;
                if((asset.isPrivate || asset.constructor.isPrivate)
                    && !this._privateIds.has(assetId)) continue;
                if(this._filter && !this._filter(asset)) continue;
                filteredAssets[assetId] = { Name: asset.name };
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredAssets, (assetId) => {
                if(assetId == "null\n") assetId = null;
                this._handleAssetSelection(assetId);
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        };
        this._editButton.onClickAndTouch = () => {
            if(!this._lastValue) return;
            let asset = ProjectHandler.getAsset(this._lastValue);
            if(!asset) return;
            let assetType = asset.constructor.assetType;
            let page = global.menuController.getPage(assetType);
            page.setAsset(asset);
            global.menuController.pushPage(assetType);
        };
    }

    _handleAssetSelection(assetId) {
        if(assetId == "null\n") {
            assetId = null;
        }
        if(this._lastValue != assetId) {
            if(this._onUpdate) this._onUpdate(assetId);
            this._updateAsset(assetId);
        }
        global.menuController.back();
    }

    _updateAsset(assetId) {
        this._lastValue = assetId;
        let asset = ProjectHandler.getAsset(this._lastValue);
        let assetName = asset
            ? asset.name
            : Scene.id == this._lastValue ? 'Scene' : " ";
        assetName = stringWithMaxLength(assetName, 16);
        this._assetSelection.textComponent.text = assetName;
        if(asset) {
            this._buttonsSpan.add(this._editButton);
        } else {
            this._buttonsSpan.remove(this._editButton);
        }
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let asset = this._getFromSource();
        if(this._lastValue != asset) this._updateAsset(asset);
    }
}

export default AssetField;
