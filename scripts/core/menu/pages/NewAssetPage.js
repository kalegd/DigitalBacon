/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import AssetScriptTypes from '/scripts/core/enums/AssetScriptTypes.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AudioFileTypes from '/scripts/core/enums/AudioFileTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import ModelFileTypes from '/scripts/core/enums/ModelFileTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { FontSizes, euler, quaternion, vector3s } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const URL_PREFIX_PATTERN = /^https:\/\//i;

const SPECIAL_OPTIONS = {
    CDN: {
        assetName: 'Load from CDN',
        handler: '_loadFromCDN',
    },
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
        let asset = ProjectHandler.addNewAsset(item.assetId, params);
        this.back();
        if(this._additionalAction) this._additionalAction(asset);
    }

    _loadFromCDN() {
        let inputPage = this._controller.getPage(MenuPages.TEXT_INPUT);
        inputPage.setContent("Load from CDN", "URL", "Load",
            (url) => {
                if(!this._isUrlValid(url)) return;
                this._controller.back();
                let textPage = this._controller.getPage(MenuPages.TEXT);
                textPage.setContent("Load from CDN", "Loading...");
                this._controller.pushPage(MenuPages.TEXT);
                LibraryHandler.loadExternalAsset(url, (assetId) => {
                    this._handleExternalAsset(assetId);
                }, () => {
                    PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                        text: 'Sorry, something went wrong while loading the file'
                    });
                    if(this._controller.getCurrentPage() == textPage)
                        this._controller.back();
                });
            }
        );
        this._controller.pushPage(MenuPages.TEXT_INPUT);
    }

    _isUrlValid(url) {
        if(!URL_PREFIX_PATTERN.test(url)) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'URL must begin with https://',
            });
            return false;
        }
        let extension = url.split('.').pop().toLowerCase();
        if(this._assetType == AssetTypes.MODEL) {
            if(!(extension in ModelFileTypes)) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'File type not supported for Model'
                });
                return false;
            }
        } else if(this._assetType == AssetTypes.IMAGE) {
            if(!(extension in ImageFileTypes)) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'File type not supported for Image'
                });
                return false;
            }
        } else if(this._assetType == AssetTypes.AUDIO) {
            if(!(extension in AudioFileTypes)) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'File type not supported for Audio'
                });
                return false;
            }
        } else if(extension != 'js') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'File type not supported for script'
            });
            return false;
        }
        return true;
    }

    _handleExternalAsset(assetId) {
        let params;
        let assetType = LibraryHandler.getType(assetId);
        if(assetType in AssetEntityTypes) {
            params = this._getNewEntityParams()
            params['assetId'] = assetId;
        }
        let asset = ProjectHandler.addNewAsset(assetId, params);
        let textPage = this._controller.getPage(MenuPages.TEXT);
        if(textPage._object.parent) this._controller.back();
        if(assetType != this._assetType) return;
        if(this._object.parent) this._controller.back();
        if(this._additionalAction) this._additionalAction(asset);
    }

    _uploadFromDevice() {
        UploadHandler.triggerUpload();
    }

    _uploadCallback(assetIds) {
        let newAssets = [];
        let params = this._getNewEntityParams();
        for(let assetId of assetIds) {
            params['assetId'] = assetId;
            let type = LibraryHandler.getType(assetId);
            let asset = (type in AssetEntityTypes)
                ? ProjectHandler.addNewAsset(assetId, params)
                : ProjectHandler.addNewAsset(assetId);
            if(type == this._assetType) newAssets.push(asset);
        }
        if(newAssets.length > 0 && this._additionalAction) {
            this.back();
            this._additionalAction(newAssets[0]);
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
            this._items.push(SPECIAL_OPTIONS.CDN);
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
            this._items =ProjectHandler.getAssetClassesForType(this._assetType);
            if(this._assetType == AssetTypes.TEXTURE) return;
            this._items.unshift(SPECIAL_OPTIONS.CDN);
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
