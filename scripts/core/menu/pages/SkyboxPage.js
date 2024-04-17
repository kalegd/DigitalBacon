/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Styles, Textures } from '/scripts/core/helpers/constants.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Image, Span, Text } from '/scripts/DigitalBacon-UI.js';

const sides = [
    CubeSides.TOP,
    CubeSides.LEFT,
    CubeSides.FRONT,
    CubeSides.RIGHT,
    CubeSides.BACK,
    CubeSides.BOTTOM,
];

class SkyboxPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._buttons = [];
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Backdrop', Styles.title);
        this.add(titleBlock);

        let columnBlock = new Div({
            height: 0.196,
            justifyContent: 'spaceBetween',
            width: 0.45,
        });
        let rowBlock = new Span({
            height: 0.06,
            justifyContent: 'spaceBetween',
            width: 0.264,
        });
        for(let i = 0; i < sides.length; i++) {
            let button = new Image(Textures.searchIcon, {
                height: 0.06,
                width: 0.06,
            });
            button.pointerInteractable = new PointerInteractable(button);
            button.onClick = () => {
                let library = LibraryHandler.getLibrary();
                let filteredAssets = {};
                filteredAssets["null\n"] = { Name: "Blank" };
                for(let assetId in library) {
                    let asset = library[assetId];
                    if(asset['Type'] == AssetTypes.IMAGE)
                        filteredAssets[assetId] = asset;
                }
                let page = this._controller.getPage(MenuPages.ASSET_SELECT);
                page.setContent(filteredAssets, (assetId) => {
                    if(assetId == "null\n") assetId = null;
                    SettingsHandler.setSkyboxSide(sides[i], assetId);
                    this._controller.back();
                }, () => {
                    this._fileUploadSide = sides[i];
                    UploadHandler.triggerAssetsUpload((assetIds) => {
                        if(assetIds.length > 0) {
                            SettingsHandler.setSkyboxSide(this._fileUploadSide,
                                assetIds[0]);
                            this._controller.back();
                        }
                    }, false, AssetTypes.IMAGE);
                });
                this._controller.pushPage(MenuPages.ASSET_SELECT);
            };
            if(i == 0) {
                button.marginRight = 0.068;
                columnBlock.add(button);
                columnBlock.add(rowBlock);
            } else if(i < 5) {
                rowBlock.add(button);
            } else {
                button.marginRight = 0.068;
                columnBlock.add(button);
            }
            this._buttons.push(button);
        }
        this.add(columnBlock);
    }

    _setTextures() {
        let textures = SettingsHandler.getSkyboxTextures();
        for(let i = 0; i < sides.length; i++) {
            if(this._buttons[i].material.map != textures[sides[i]]) {
                this._buttons[i].updateTexture(textures[sides[i]]);
            }
        }
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.SETTINGS_UPDATED, () => {
            this._setTextures();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.SETTINGS_UPDATED);
    }

    _onAdded() {
        super._onAdded();
        this._setTextures();
        this._addSubscriptions();
    }

    _onRemoved() {
        super._onRemoved();
        this._removeSubscriptions();
    }

}

export default SkyboxPage;
