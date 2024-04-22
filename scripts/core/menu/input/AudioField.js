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
import PubSub from '/scripts/core/handlers/PubSub.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span, Text } from '/scripts/DigitalBacon-UI.js';

class AudioField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateAudio(this._lastValue);
    }

    _createInputs(title) {
        this._addTitle(title);
        this._audioSelection = createWideButton('');
        this._audioSelection.textComponent.fontSize = 0.017;
        this._audioSelection.height = 0.03;
        this._audioSelection.width = 0.17;
        this._updateAudio();
        this.add(this._audioSelection);
        this._audioSelection.onClickAndTouch = () => {
            let library = LibraryHandler.getLibrary();
            let filteredAssets = {};
            filteredAssets["null\n"] = { Name: "Blank" };
            for(let assetId in library) {
                let asset = library[assetId];
                if(asset['Type'] == AssetTypes.AUDIO)
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
                }, false, AssetTypes.AUDIO);
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        };
    }

    _handleAssetSelection(assetId) {
        if(assetId == "null\n") {
            assetId = null;
        } else if(LibraryHandler.getType(assetId) != AssetTypes.AUDIO) {
            assetId = this._lastValue;
        }
        if(this._lastValue != assetId) {
            if(this._onUpdate) this._onUpdate(assetId);
            this._updateAudio(assetId);
        }
        global.menuController.back();
    }

    _updateAudio(assetId) {
        this._lastValue = assetId;
        let audioName = this._lastValue
            ? LibraryHandler.getAssetName(this._lastValue)
            : " ";
        audioName = stringWithMaxLength(audioName, 16);
        this._audioSelection.textComponent.text = audioName;
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let audio = this._getFromSource();
        if(this._lastValue != audio) this._updateAudio(audio);
    }
}

export default AudioField;
