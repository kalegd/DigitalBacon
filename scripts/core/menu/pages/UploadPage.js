/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { euler, quaternion, vector3s } from '/scripts/core/helpers/constants.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const OPTIONS = {
    'Select from Device': '_uploadAsset',
    'Select from Sketchfab': '_selectFromSketchfab',
};

class UploadPage extends PaginatedPage {
    constructor(controller) {
        super(controller, true);
        this._items = Object.keys(OPTIONS);
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
        this._addList();
    }

    _getItemName(item) {
        return item;
    }

    _handleItemInteraction(item) {
        this[OPTIONS[item]]();
    }

    _refreshItems() {

    }

    _uploadAsset() {
        UploadHandler.triggerUpload();
    }

    _selectFromSketchfab() {
        if(Sketchfab.isSignedIn()) {
            this._controller.pushPage(MenuPages.SKETCHFAB_SEARCH);
        } else {
            this._controller.pushPage(MenuPages.SKETCHFAB_LOGIN);
        }
    }

    _uploadCallback(assetIds) {
        this._controller
            .getPosition(vector3s[0]);
        this._controller
            .getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        let position = vector3s[0].sub(vector3s[1]).toArray();
        vector3s[0].set(0, 0, 1);
        vector3s[1].setY(0).normalize();
        quaternion.setFromUnitVectors(vector3s[0], vector3s[1]);
        euler.setFromQuaternion(quaternion);
        let rotation = euler.toArray();
        for(let assetId of assetIds) {
            let type = LibraryHandler.getType(assetId);
            if(type in AssetEntityTypes) {
                let params = {
                    "assetId": assetId,
                    "position": position,
                    "rotation": rotation,
                    "visualEdit": true,
                };
                ProjectHandler.addNewAsset(assetId, params);
            } else {
                ProjectHandler.addNewAsset(assetId);
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
