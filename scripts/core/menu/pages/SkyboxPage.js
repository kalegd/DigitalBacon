/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
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
        super(controller, false, true);
        this._buttons = [];
        this._addPageContent();
        this._input = document.createElement('input');
        this._input.type = "file";
        this._input.accept = "image/*";
        this._addEventListeners();
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
            let interactable = new PointerInteractable(button, () => {
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
                    this._triggerFileUpload = true;
                }, () => {
                    document.removeEventListener(this._eventType,
                        this._clickListener);
                });
                this._controller.pushPage(MenuPages.ASSET_SELECT);
                document.addEventListener(this._eventType, this._clickListener);
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

    _uploadFile() {
        if(this._input.files.length > 0) {
            let file = this._input.files[0];
            let extension = file.name.split('.').pop().toLowerCase();
            if(extension in ImageFileTypes) {
                LibraryHandler.addNewAsset(file, file.name, AssetTypes.IMAGE,
                    (assetId) => {
                        SettingsHandler.setSkyboxSide(this._fileUploadSide,
                            assetId);
                        this._controller.back();
                    });
            } else {
                console.log("TODO: Tell user invalid filetype, and list valid ones");
            }
        }
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

    addToScene(scene, parentInteractable) {
        super.addToScene(scene, parentInteractable);
        this._setTextures();
    }

}

export default SkyboxPage;
