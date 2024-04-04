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
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

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
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Backdrop',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });
        let rowBlock = new ThreeMeshUI.Block({
            'height': 0.064,
            'width': 0.3,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
        });
        for(let i = 0; i < sides.length; i++) {
            let button = ThreeMeshUIHelper.createButtonBlock({
                'backgroundTexture': Textures.searchIcon,
                'height': 0.06,
                'width': 0.06,
                'margin': 0.002,
                'borderRadius': 0.00001,
            });
            let interactable = new PointerInteractable(button);
            interactable.addEventListener('click', () => {
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
            });
            this._containerInteractable.addChild(interactable);
            if(i == 0) {
                let topRowBlock = new ThreeMeshUI.Block({
                    'height': 0.064,
                    'width': 0.128,
                    'contentDirection': 'row',
                    'justifyContent': 'start',
                    'backgroundOpacity': 0,
                });
                topRowBlock.add(button);
                columnBlock.add(topRowBlock);
            } else if(i < 5) {
                rowBlock.add(button);
            } else {
                columnBlock.add(rowBlock);

                let bottomRowBlock = new ThreeMeshUI.Block({
                    'height': 0.064,
                    'width': 0.128,
                    'contentDirection': 'row',
                    'justifyContent': 'start',
                    'backgroundOpacity': 0,
                });
                bottomRowBlock.add(button);
                columnBlock.add(bottomRowBlock);
            }
            this._buttons.push(button);
        }
        this._container.add(columnBlock);
    }

    _setTextures() {
        let textures = SettingsHandler.getSkyboxTextures();
        for(let i = 0; i < sides.length; i++) {
            if(this._buttons[i].children[1].backgroundTexture
                != textures[sides[i]])
            {
                this._buttons[i].children[1].set({
                    backgroundTexture: textures[sides[i]] });
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

    addToScene(scene, parentInteractable) {
        super.addToScene(scene, parentInteractable);
        this._setTextures();
        this._addSubscriptions();
    }

    removeFromScene() {
        super.removeFromScene();
        this._removeSubscriptions();
    }

}

export default SkyboxPage;
