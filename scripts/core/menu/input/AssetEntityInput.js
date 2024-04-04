/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import Scene from '/scripts/core/assets/Scene.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 13;

class AssetEntityInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._onUpdate = params['onUpdate'];
        this._lastValue =  params['initialValue'];
        this._exclude =  params['exclude'];
        this._filter =  params['filter'];
        this._includeScene =  params['includeScene'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateAssetEntity(this._lastValue);
    }

    _createInputs(title) {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'contentDirection': 'row',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': title,
            'fontSize': FontSizes.body,
            'height': HEIGHT,
            'width': TITLE_WIDTH,
            'margin': 0,
            'textAlign': 'left',
        });
        this._assetEntitySelection = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'idleOpacity': 0.9,
            'hoveredOpacity': 1,
            'selectedOpacity': 1,
        });
        this._updateAssetEntity();
        this._object.add(titleBlock);
        this._object.add(this._assetEntitySelection);
        let interactable = new PointerInteractable(this._assetEntitySelection);
        interactable.addEventListener('click', () => {
            let assets = ProjectHandler.getAssets();
            let filteredAssets = {};
            filteredAssets["null\n"] = { Name: "Blank" };
            if(this._includeScene)
                filteredAssets[Scene.getId()] = { Name: 'Scene' };
            for(let assetId in assets) {
                if(this._exclude == assetId) continue;
                let asset = assets[assetId];
                if(asset instanceof InternalAssetEntity) continue;
                if(asset instanceof AssetEntity) {
                    if(this._filter && !this._filter(asset)) continue;
                    filteredAssets[assetId] = { Name: asset.getName() };
                }
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredAssets, (assetId) => {
                if(assetId == "null\n") assetId = null;
                this._handleAssetSelection(assetId);
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        });
        this._pointerInteractable.addChild(interactable);
    }

    _handleAssetSelection(assetId) {
        if(assetId == "null\n") {
            assetId = null;
        }
        if(this._lastValue != assetId) {
            if(this._onUpdate) this._onUpdate(assetId);
            this._updateAssetEntity(assetId);
        }
        global.menuController.back();
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
    }

    _updateAssetEntity(assetId) {
        this._lastValue = assetId;
        let assetEntity = ProjectHandler.getAsset(this._lastValue);
        let assetEntityName = assetEntity
            ? assetEntity.getName()
            : Scene.getId() == this._lastValue ? 'Scene' : " ";
        assetEntityName = stringWithMaxLength(assetEntityName,FIELD_MAX_LENGTH);
        let textComponent = this._assetEntitySelection.children[1];
        textComponent.set({ content: assetEntityName });
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        //Required method
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let assetEntity = this._getFromSource();
        if(this._lastValue != assetEntity) this._updateAssetEntity(assetEntity);
    }
}

export default AssetEntityInput;
