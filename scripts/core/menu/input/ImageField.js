/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createWideImageButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Style } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class ImageField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateImage(this._lastValue);
    }

    _createInputs(title) {
        this._addTitle(title);
        this._materialColorStyle = new Style({ materialColor: 0xffffff });
        this._imageSelection = createWideImageButton();
        this._imageSelection.addStyle(this._materialColorStyle);
        this._imageSelection.textComponent.fontSize = 0.017;
        this._imageSelection.height = 0.03;
        this._imageSelection.width = 0.17;
        this._updateImage();
        this.add(this._imageSelection);
        this._imageSelection.onClickAndTouch = () => {
            let library = LibraryHandler.getLibrary();
            let filteredAssets = {};
            filteredAssets["null\n"] = { Name: "Blank" };
            for(let assetId in library) {
                let asset = library[assetId];
                if(asset['Type'] == AssetTypes.IMAGE)
                    filteredAssets[assetId] = asset;
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredAssets, (assetId) => {
                if(assetId == "null\n") assetId = null;
                this._handleAssetSelection(assetId);
            }, () => {
                UploadHandler.triggerAssetsUpload((assetIds) => {
                    if(assetIds.length > 0)
                        this._handleAssetSelection(assetIds[0]);
                }, false, AssetTypes.IMAGE);
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        };
    }

    _handleAssetSelection(assetId) {
        if(assetId == "null\n") assetId = null;
        if(this._lastValue != assetId) {
            if(this._onUpdate) this._onUpdate(assetId);
            this._updateImage(assetId);
        }
        global.menuController.back();
    }

    _updateImage(assetId) {
        let imageName = assetId
            ? LibraryHandler.getAssetName(assetId)
            : " ";
        imageName = stringWithMaxLength(imageName, 16);
        this._imageSelection.textComponent.text = imageName;
        if(this._lastValue == assetId) return;
        this._lastValue = assetId;
        if(assetId) {
            this._imageSelection.updateTexture(LibraryHandler.getTexture(
                this._lastValue));
            this._materialColorStyle.materialColor = Colors.white;
        } else {
            this._imageSelection.updateTexture();
            this._materialColorStyle.materialColor = Colors.defaultIdle;
        }
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let image = this._getFromSource();
        if(this._lastValue != image) this._updateImage(image);
    }
}

export default ImageField;
