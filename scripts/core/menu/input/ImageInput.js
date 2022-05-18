/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import InteractableStates from '/scripts/core/enums/InteractableStates.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Colors, Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 13;

const STATE_COLORS = {};
STATE_COLORS[InteractableStates.IDLE] = Colors.defaultIdle;
STATE_COLORS[InteractableStates.HOVERED] = Colors.defaultHovered;
STATE_COLORS[InteractableStates.SELECTED] = Colors.defaultHovered;

class ImageInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._setToSource = params['setToSource'];
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._input = document.createElement('input');
        this._input.type = "file";
        this._input.accept = "image/*";
        this._addEventListeners();
        this._updateImage(this._lastValue);
    }

    _addEventListeners() {
        this._input.addEventListener("change", () => { this._uploadFile(); });
        if(global.deviceType != "XR") {
            this._input.addEventListener("click",
                (e) => { e.stopPropagation(); });
            this._eventType = global.deviceType == "MOBILE"
                ? 'touchend'
                : 'click';
            this._clickListener = (e) => {
                setTimeout(() => {
                    if(this._triggerFileUpload) {
                        this._triggerFileUpload = false;
                        this._input.click();
                    }
                }, 20);
            };
            //Why this convoluted chain of event listener checking a variable
            //set by interactable action (which uses polling)? Because we can't
            //trigger the file input with a click event outside of an event
            //listener on Firefox and Safari :(
        }
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
        this._imageSelection = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'idleOpacity': 0.9,
            'hoveredOpacity': 1,
            'selectedOpacity': 1,
        });
        this._updateImage();
        this._object.add(titleBlock);
        this._object.add(this._imageSelection);
        let interactable = new PointerInteractable(this._imageSelection, () => {
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
                this._triggerFileUpload = true;
            }, () => {
                document.removeEventListener(this._eventType,
                    this._clickListener);
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
            document.addEventListener(this._eventType, this._clickListener);
        });
        this._pointerInteractable.addChild(interactable);
    }

    _uploadFile() {
        if(this._input.files.length > 0) {
            let file = this._input.files[0];
            let extension = file.name.split('.').pop().toLowerCase();
            if(extension in ImageFileTypes) {
                LibraryHandler.addNewAsset(file, file.name, AssetTypes.IMAGE,
                    (assetId) => { this._handleAssetSelection(assetId); });
            } else {
                console.log("TODO: Tell user invalid filetype, and list valid ones");
            }
        }
    }

    _handleAssetSelection(assetId) {
        if(assetId == "null\n") assetId = null;
        let preValue = this._lastValue;
        this._setToSource(assetId);
        this._updateImage(assetId);
        global.menuController.back();
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
        if(preValue == assetId) return;
        UndoRedoHandler.addAction(() => {
            this._setToSource(preValue);
            this._updateImage(preValue);
        }, () => {
            this._setToSource(assetId);
            this._updateImage(assetId);
        });
    }

    _updateImage(assetId) {
        this._lastValue = assetId;
        let imageName = this._lastValue
            ? LibraryHandler.getAssetName(this._lastValue)
            : " ";
        imageName = stringWithMaxLength(imageName, FIELD_MAX_LENGTH);
        let textComponent = this._imageSelection.children[1];
        textComponent.set({ content: imageName });
        if(this._lastValue) {
            for(let interactableState in InteractableStates) {
                let state = this._imageSelection.states[interactableState];
                state.attributes.backgroundColor = Colors.white;
            }
            this._imageSelection.set({
                backgroundTexture: LibraryHandler.getTexture(this._lastValue),
                backgroundColor: Colors.white,
            });
        } else {
            for(let interactableState in InteractableStates) {
                let state = this._imageSelection.states[interactableState];
                state.attributes.backgroundColor =
                    STATE_COLORS[interactableState];
            }
            this._imageSelection.set({
                backgroundTexture: null,
                backgroundColor: Colors.defaultIdle,
            });
        }
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
        let image = this._getFromSource();
        if(this._lastValue != image) this._updateImage(image);
    }
}

export default ImageInput;
