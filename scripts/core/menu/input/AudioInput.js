/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 13;

class AudioInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._onUpdate = params['onUpdate'];
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateAudio(this._lastValue);
    }

    _createInputs(title) {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'contentDirection': 'row',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': title,
            'fontSize': FontSizes.body,
            'height': HEIGHT,
            'width': TITLE_WIDTH,
            'margin': 0,
            'textAlign': 'left',
        });
        this._audioSelection = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'idleOpacity': 0.9,
            'hoveredOpacity': 1,
            'selectedOpacity': 1,
        });
        this._updateAudio();
        this._object.add(titleBlock);
        this._object.add(this._audioSelection);
        let interactable = new PointerInteractable(this._audioSelection);
        interactable.addEventListener('click', () => {
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
        });
        this._pointerInteractable.addChild(interactable);
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
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
    }

    _updateAudio(assetId) {
        this._lastValue = assetId;
        let audioName = this._lastValue
            ? LibraryHandler.getAssetName(this._lastValue)
            : " ";
        audioName = stringWithMaxLength(audioName, FIELD_MAX_LENGTH);
        let textComponent = this._audioSelection.children[1];
        textComponent.set({ content: audioName });
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        //Required method
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let audio = this._getFromSource();
        if(this._lastValue != audio) this._updateAudio(audio);
    }
}

export default AudioInput;
