/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import MaterialsHandler from '/scripts/core/handlers/assetTypes/MaterialsHandler.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';

import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import { InteractableStates } from '/scripts/DigitalBacon-UI.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.13;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 9;
const HSL = {};

const STATE_COLORS = {};
STATE_COLORS[InteractableStates.IDLE] = Colors.defaultIdle;
STATE_COLORS[InteractableStates.HOVERED] = Colors.defaultHovered;
STATE_COLORS[InteractableStates.SELECTED] = Colors.defaultHovered;

class MaterialInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._onUpdate = params['onUpdate'];
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateMaterial(this._lastValue);
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
        this._materialBlock = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'idleBackgroundColor': Colors.white,
            'hoveredBackgroundColor': Colors.white,
            'selectedBackgroundColor': Colors.white,
            'idleOpacity': 0.9,
            'hoveredOpacity': 1,
            'selectedOpacity': 1,
        });
        this._editButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.pencilIcon,
            'height': 0.03,
            'width': 0.03,
            'margin': 0,
        });
        this._object.add(titleBlock);
        this._object.add(this._materialBlock);
        this._object.add(this._editButton);
        let interactable = new PointerInteractable(this._materialBlock, true);
        interactable.addAction(() => {
            let materials = MaterialsHandler.getAssets();
            let filteredMaterials = {};
            filteredMaterials["null\n"] = { Name: "Blank" };
            for(let materialId in materials) {
                filteredMaterials[materialId] =
                    { Name: materials[materialId].getName() };
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredMaterials, (materialId) => {
                if(materialId == "null\n") materialId = null;
                this._handleMaterialSelection(materialId);
            }, () => {
                this._selectNewMaterial();
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        });
        this._editInteractable = new PointerInteractable(this._editButton,true);
        this._editInteractable.addAction(() => {
            if(!this._lastValue) return;
            let material = MaterialsHandler.getAsset(this._lastValue);
            let materialPage = global.menuController.getPage(
                MenuPages.MATERIAL);
            materialPage.setAsset(material);
            global.menuController.pushPage(MenuPages.MATERIAL);
        });
        this._pointerInteractable.addChild(interactable);
    }

    _selectNewMaterial() {
        let currentPage = global.menuController.getCurrentPage();
        let newMaterialPage = global.menuController.getPage(
            MenuPages.NEW_MATERIAL);
        newMaterialPage.setContent((material) => {
            this._handleMaterialSelection(material.getId(), currentPage);
            if(currentPage != global.menuController.getCurrentPage()) return;
            let materialPage = global.menuController.getPage(
                MenuPages.MATERIAL);
            materialPage.setAsset(material);
            global.menuController.pushPage(MenuPages.MATERIAL);
        });
        global.menuController.pushPage(MenuPages.NEW_MATERIAL);
    }

    _handleMaterialSelection(materialId, callingPage) {
        if(materialId == "null\n") materialId = null;
        if(this._lastValue != materialId) {
            if(this._onUpdate) this._onUpdate(materialId);
            this._updateMaterial(materialId);
        }
        if(!callingPage || callingPage ==global.menuController.getCurrentPage())
            global.menuController.back();
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
    }

    _updateMaterial(materialId) {
        this._lastValue = materialId;
        let material = MaterialsHandler.getAsset(this._lastValue);
        let materialName = material
            ? material.getName()
            : " ";
        materialName = stringWithMaxLength(materialName, FIELD_MAX_LENGTH);
        let textComponent = this._materialBlock.children[1];
        textComponent.set({ content: materialName });
        if(material) {
            let color = material.getMaterial().color || Colors.white;
            for(let interactableState in InteractableStates) {
                let state = this._materialBlock.states[interactableState];
                state.attributes.backgroundColor = color;
            }
            this._updateTextureAndColor(material.getSampleTexture(), color);
            this._pointerInteractable.addChild(this._editInteractable);
            this._editButton.visible = true;
        } else {
            for(let interactableState in InteractableStates) {
                let state = this._materialBlock.states[interactableState];
                state.attributes.backgroundColor =
                    STATE_COLORS[interactableState];
            }
            this._updateTextureAndColor(null, Colors.defaultIdle);
            this._pointerInteractable.removeChild(this._editInteractable);
            this._editButton.visible = false;
        }
    }

    _updateTextureAndColor(texture, color) {
        if(this._materialBlock.backgroundTexture != texture)
            this._materialBlock.set({ backgroundTexture: texture });
        if(this._materialBlock.backgroundColor != color)
            this._materialBlock.set({ backgroundColor: color });
        this._materialBlock.backgroundColor.getHSL(HSL);
        let fontColor = (!texture && HSL.l > 0.85)
            ? Colors.black
            : Colors.white;
        if(this._materialBlock.children[1].fontColor != fontColor)
            this._materialBlock.children[1].set({ fontColor: fontColor });
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_UPDATED, (message) => {
            if(this._lastValue == message.asset.getId())
                this.updateFromSource();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_UPDATED);
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
        this._updateMaterial(this._getFromSource());
    }

    addToScene(scene, interactableParent) {
        this.updateFromSource();
        this._addSubscriptions();
        super.addToScene(scene, interactableParent);
    }

    removeFromScene() {
        this._removeSubscriptions();
        super.removeFromScene();
    }
}

export default MaterialInput;
