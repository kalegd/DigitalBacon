/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import FileTypes from '/scripts/core/enums/FileTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import ModelFileTypes from '/scripts/core/enums/ModelFileTypes.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class UploadPage extends MenuPage {
    constructor(controller) {
        super(controller, false, true);
        this._addPageContent();
        this._input = document.createElement('input');
        this._input.type = "file";
        this._input.multiple = true;
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
            'text': 'Upload Asset',
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
        let linkButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "Select File",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
        });
        columnBlock.add(linkButton);
        let interactable = new PointerInteractable(linkButton, () => {
            if(global.deviceType == 'XR') {
                SessionHandler.exitXRSession();
                this._input.click();
            } else {
                this._triggerFileUpload = true;
            }
        });
        this._containerInteractable.addChild(interactable);
        this._container.add(columnBlock);
    }

    _uploadFile() {
        for(let file of this._input.files) {
            let extension = file.name.split('.').pop().toLowerCase();
            if(extension in FileTypes) {
                if(extension in ImageFileTypes) {
                    LibraryHandler.addNewAsset(file, file.name,
                        AssetTypes.IMAGE, (assetId) => {
                            let position = this._controller
                                .getPosition(vector3s[0]);
                            let direction = this._controller
                                .getDirection(vector3s[1]).normalize()
                                .divideScalar(4);
                            ProjectHandler.addImage({
                                "assetId": assetId,
                                "position": position.sub(direction).toArray(),
                                "rotation": [0,0,0],
                                "doubleSided": true,
                                "transparent": true,
                                "enableInteractions": true,
                            });
                    });
                } else if(extension in ModelFileTypes) {
                    LibraryHandler.addNewAsset(file, file.name,AssetTypes.MODEL,
                        (assetId) => {
                            let position = this._controller
                                .getPosition(vector3s[0]);
                            let direction = this._controller
                                .getDirection(vector3s[1]).normalize()
                                .divideScalar(4);
                            ProjectHandler.addGLTF({
                                "assetID": assetId,
                                "position": position.sub(direction).toArray(),
                                "rotation": [0,0,0],
                                "enableInteractions": true,
                            });
                    });
                } else {
                    console.log("TODO: Support other file types");
                }
            } else {
                console.log("TODO: Tell user invalid filetype, and list valid ones");
            }
        }
        this._input.value = '';
    }

    addToScene(scene, parentInteractable) {
        document.addEventListener(this._eventType, this._clickListener);
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        document.removeEventListener(this._eventType, this._clickListener);
        super.removeFromScene();
    }
}

export default UploadPage;
