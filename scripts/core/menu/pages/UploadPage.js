/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class UploadPage extends MenuPage {
    constructor(controller) {
        super(controller, false, true);
        this._addPageContent();
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
            UploadHandler.triggerUpload();
        });
        this._containerInteractable.addChild(interactable);
        this._container.add(columnBlock);
    }

    _uploadCallback(assetIds) {
        let position = this._controller
            .getPosition(vector3s[0]);
        let direction = this._controller
            .getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        position.sub(direction);
        for(let assetId of assetIds) {
            let type = LibraryHandler.getType(assetId);
            if(type == AssetTypes.IMAGE) {
                ProjectHandler.addImage({
                    "assetId": assetId,
                    "position": position.toArray(),
                    "rotation": [0,0,0],
                    "doubleSided": true,
                    "transparent": true,
                    "enableInteractions": true,
                });
            } else if(type == AssetTypes.MODEL) {
                ProjectHandler.addGLTF({
                    "assetId": assetId,
                    "position": position.toArray(),
                    "rotation": [0,0,0],
                    "enableInteractions": true,
                });
            }
        }
    }

    addToScene(scene, parentInteractable) {
        UploadHandler.listenForAssets((assetIds) => {
            this._uploadCallback(assetIds);
        }, true);
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        UploadHandler.stopListening();
        super.removeFromScene();
    }
}

export default UploadPage;
