/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import AssetScriptTypes from '/scripts/core/enums/AssetScriptTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, euler, quaternion, vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const SPECIAL_OPTIONS = {
    DEVICE: {
        assetName: 'Select from Device',
        handler: '_uploadFromDevice',
    },
    SKETCHFAB: {
        assetName: 'Select from Sketchfab',
        handler: '_selectFromSketchfab',
    },
};

class NewAssetPage extends PaginatedPage {
    constructor(controller, assetType) {
        super(controller, true);
        this._assetHandler = ProjectHandler.getAssetHandler(assetType);
        this._assetType = assetType;
        this._items = [];
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Add New Asset',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.3,
        });
        this._container.add(titleBlock);

        this._addList();
    }

    _getItemName(item) {
        return item.assetName;
    }

    _handleItemInteraction(item) {
        if(item.handler) {
            this[item.handler]();
            return;
        }
        let params;
        if(this._assetType in AssetEntityTypes) {
            params = this._getNewEntityParams()
            params['assetId'] = item.assetId;
        }
        let asset = this._assetHandler.addNewAsset(item.assetId, params);
        this.back();
        if(this._additionalAction) this._additionalAction(asset);
    }

    _uploadFromDevice() {
        UploadHandler.triggerUpload();
    }

    _uploadCallback(assetIds) {
        let params = this._getNewEntityParams();
        for(let assetId of assetIds) {
            params['assetId'] = assetId;
            let type = LibraryHandler.getType(assetId);
            if(type in AssetEntityTypes) {
                ProjectHandler.addNewAsset(assetId, params);
            } else {
                ProjectHandler.addNewAsset(assetId);
            }
        }
    }

    _getNewEntityParams() {
        this._controller.getPosition(vector3s[0]);
        this._controller.getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        let position = vector3s[0].sub(vector3s[1]).toArray();
        vector3s[0].set(0, 0, 1);
        vector3s[1].setY(0).normalize();
        quaternion.setFromUnitVectors(vector3s[0], vector3s[1]);
        euler.setFromQuaternion(quaternion);
        let rotation = euler.toArray();
        return {
            position: position,
            rotation: rotation,
            visualEdit: true,
        };
    }

    _selectFromSketchfab() {
        if(Sketchfab.isSignedIn()) {
            this._controller.pushPage(MenuPages.SKETCHFAB_SEARCH);
        } else {
            this._controller.pushPage(MenuPages.SKETCHFAB_LOGIN);
        }
    }

    _refreshItems() {
        if(!(this._assetType in AssetScriptTypes)) {
            this._items = [];
            if(this._assetType == AssetEntityTypes.MODEL)
                this._items.push(SPECIAL_OPTIONS.SKETCHFAB);
            this._items.push(SPECIAL_OPTIONS.DEVICE);
            for(let assetId in LibraryHandler.library) {
                let libraryAsset = LibraryHandler.library[assetId];
                if(libraryAsset['Type']  == this._assetType) {
                    this._items.push({
                        assetId: assetId,
                        assetName: libraryAsset['Name'],
                    });
                }
            }
        } else {
            this._items = this._assetHandler.getAssetClasses();
            this._items.unshift(SPECIAL_OPTIONS.DEVICE);
        }
    }

    setContent(additionalAction) {
        this._additionalAction = additionalAction;
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

export default NewAssetPage;
