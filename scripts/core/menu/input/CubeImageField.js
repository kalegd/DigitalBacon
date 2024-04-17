/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Styles, Textures } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Div, Image, Span, Text } from '/scripts/DigitalBacon-UI.js';

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

class CubeImageField extends MenuField {
    constructor(params) {
        super(params);
        this.height = params['title'] ? 0.244 : 0.196;
        this.contentDirection = 'column';
        this._lastValues = {};
        if(params['initialValue']) {
            for(let key in params['initialValue']) {
                this._lastValues[key] = params['initialValue'][key];
            }
        }
        let title = params['title'] || null;
        this._buttons = [];
        this._createInputs(title);
        for(let side of SIDES) {
            this._updateImage(side, this._lastValues[side]);
        }
    }

    _createInputs(title) {
        if(title) this._addTitle(title, 0.31).height = 0.04;
        let rowBlock = new Span({
            height: 0.06,
            justifyContent: 'spaceBetween',
            width: 0.264,
        });
        for(let i = 0; i < SIDES.length; i++) {
            let button = new Image(Textures.searchIcon, {
                height: 0.06,
                width: 0.06,
            });
            button.pointerInteractable = new PointerInteractable(button);
            button.onClick = () => this._handleInteractable(SIDES[i]);
            if(i == 0) {
                button.marginRight = 0.068;
                this.add(button);
                this.add(rowBlock);
            } else if(i < 5) {
                rowBlock.add(button);
            } else {
                button.marginRight = 0.068;
                this.add(button);
            }
            this._buttons.push(button);
        }
        this.add(columnBlock);
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
            UploadHandler.triggerAssetsUpload((assetIds) => {
                if(assetIds.length > 0) {
                    this._handleAssetSelection(this._fileUploadSide,
                        assetIds[0]);
                }
            }, false, AssetTypes.IMAGE);
        });
        global.menuController.pushPage(MenuPages.ASSET_SELECT);
    }

    _handleAssetSelection(side, assetId) {
        if(assetId == "null\n") assetId = null;
        if(this._lastValues[side] != assetId) {
            if(this._onUpdate) this._onUpdate(side, assetId);
            this._updateImage(side, assetId);
        }
        global.menuController.back();
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
    }

    _updateImage(side, assetId) {
        let index = SIDES_MAP[side];
        this._lastValues[side] = assetId;
        if(assetId) {
            this._buttons[index].updateTexture(
                LibraryHandler.getTexture(assetId));
        } else {
            this._buttons[index].updateTexture(Textures.searchIcon);
        }
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

export default CubeImageField;
