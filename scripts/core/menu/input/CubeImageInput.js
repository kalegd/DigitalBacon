/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.2;
const WIDTH = 0.31;
const TITLE_HEIGHT = 0.04;
const TITLE_WIDTH = 0.31;
const FIELD_HEIGHT = 0.06;
const FIELD_WIDTH = 0.06;
const FIELD_MARGIN = 0.002;
const SIDES = [
    CubeSides.TOP,
    CubeSides.LEFT,
    CubeSides.FRONT,
    CubeSides.RIGHT,
    CubeSides.BACK,
    CubeSides.BOTTOM,
];
const SIDES_MAP = {};
SIDES_MAP[CubeSides.TOP] = 0;
SIDES_MAP[CubeSides.LEFT] = 1;
SIDES_MAP[CubeSides.FRONT] = 2;
SIDES_MAP[CubeSides.RIGHT] = 3;
SIDES_MAP[CubeSides.BACK] = 4;
SIDES_MAP[CubeSides.BOTTOM] = 5;

class CubeImageInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._setToSource = params['setToSource'];
        this._lastValues =  params['initialValue'] || {};
        this._title = params['title'] || null;
        this._buttons = [];
        this._createInputs();
        this._input = document.createElement('input');
        this._input.type = "file";
        this._input.accept = "image/*";
        this._addEventListeners();
        for(let side of SIDES) {
            this._updateImage(side, this._lastValues[side]);
        }
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

    _createInputs() {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        if(this._title) {
            let titleBlock = ThreeMeshUIHelper.createTextBlock({
                'text': this._title,
                'fontSize': FontSizes.body,
                'height': TITLE_HEIGHT,
                'width': TITLE_WIDTH,
                'margin': 0,
            });
            this._object.add(titleBlock);
        }
        let rowBlock = new ThreeMeshUI.Block({
            'height': 0.064,
            'width': 0.3,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
        });
        for(let i = 0; i < SIDES.length; i++) {
            let button = ThreeMeshUIHelper.createButtonBlock({
                'backgroundTexture': Textures.searchIcon,
                'height': 0.06,
                'width': 0.06,
                'margin': 0.002,
                'borderRadius': 0.00001,
            });
            let interactable = new PointerInteractable(button, () => {
                this._handleInteractable(SIDES[i]);
            });
            this._pointerInteractable.addChild(interactable);
            if(i == 0) {
                let topRowBlock = new ThreeMeshUI.Block({
                    'height': 0.064,
                    'width': 0.128,
                    'contentDirection': 'row',
                    'justifyContent': 'start',
                    'backgroundOpacity': 0,
                });
                topRowBlock.add(button);
                this._object.add(topRowBlock);
            } else if(i < 5) {
                rowBlock.add(button);
            } else {
                this._object.add(rowBlock);

                let bottomRowBlock = new ThreeMeshUI.Block({
                    'height': 0.064,
                    'width': 0.128,
                    'contentDirection': 'row',
                    'justifyContent': 'start',
                    'backgroundOpacity': 0,
                });
                bottomRowBlock.add(button);
                this._object.add(bottomRowBlock);
            }
            this._buttons.push(button);
        }
    }

    _handleInteractable(side) {
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
            this._handleAssetSelection(side, assetId);
        }, () => {
            this._fileUploadSide = side;
            this._triggerFileUpload = true;
        }, () => {
            document.removeEventListener(this._eventType, this._clickListener);
        });
        global.menuController.pushPage(MenuPages.ASSET_SELECT);
        document.addEventListener(this._eventType, this._clickListener);
    }

    _uploadFile() {
        if(this._input.files.length > 0) {
            let file = this._input.files[0];
            let extension = file.name.split('.').pop().toLowerCase();
            if(extension in ImageFileTypes) {
                LibraryHandler.addNewAsset(file, file.name, AssetTypes.IMAGE,
                    (assetId) => {
                        this._handleAssetSelection(this._fileUploadSide,
                            assetId);
                    });
            } else {
                console.log("TODO: Tell user invalid filetype, and list valid ones");
            }
        }
    }

    _handleAssetSelection(side, assetId) {
        if(assetId == "null\n") assetId = null;
        let preValue = this._lastValues[side];
        this._setToSource(side, assetId);
        this._updateImage(side, assetId);
        global.menuController.back();
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
        if(preValue == assetId) return;
        UndoRedoHandler.addAction(() => {
            this._setToSource(side, preValue);
            this._updateImage(side, preValue);
        }, () => {
            this._setToSource(side, assetId);
            this._updateImage(side, assetId);
        });
    }

    _updateImage(side, assetId) {
        let index = SIDES_MAP[side];
        this._lastValues[side] = assetId;
        if(assetId) {
            this._buttons[index].children[1].set({
                backgroundTexture: LibraryHandler.getTexture(assetId) });
        } else {
            this._buttons[index].children[1].set({
                backgroundTexture: Textures.searchIcon });
        }
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        if(this._title) return HEIGHT + TITLE_HEIGHT;
        return HEIGHT;
    }

    deactivate() {
        //Required method
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let images = this._getFromSource();
        for(let side of SIDES) {
            if(this._lastValues[side] != images[side]) {
                this._updateImage(side, images[side]);
            }
        }
    }
}

export default CubeImageInput;
