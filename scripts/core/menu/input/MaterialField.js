/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import MaterialsHandler from '/scripts/core/handlers/assetTypes/MaterialsHandler.js';
import { Colors, Textures } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createSmallButton, createWideImageButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span, Style } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const HSL = {};

class MaterialField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._privateIds = params['privateIds'] || new Set();
        this._createInputs(title);
        this._updateMaterial(this._lastValue);
    }

    _createInputs(title) {
        this._addTitle(title);
        this._buttonsSpan = new Span({ height: 0.03, width: 0.17 });
        this._materialColorStyle = new Style({ materialColor: 0xffffff });
        this._materialSelection = createWideImageButton('');
        this._materialSelection.addStyle(this._materialColorStyle);
        this._materialSelection.textComponent.fontSize = 0.017;
        this._materialSelection.height = 0.03;
        this._materialSelection.width = 0.13;
        this._editButton = createSmallButton(Textures.pencilIcon);
        this._editButton.marginLeft = 0.01;
        this._editButton.height = 0.03;
        this._editButton.width = 0.03;
        this._buttonsSpan.add(this._materialSelection);
        this._buttonsSpan.add(this._editButton);
        this.add(this._buttonsSpan);
        this._materialSelection.onClickAndTouch = () => {
            let materials = MaterialsHandler.getAssets();
            let filteredMaterials = {};
            filteredMaterials["null\n"] = { Name: "Blank" };
            for(let materialId in materials) {
                let material = materials[materialId];
                if((material.isPrivate || material.constructor.isPrivate)
                    && !this._privateIds.has(materialId)) continue;
                filteredMaterials[materialId] = { Name: material.name };
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredMaterials, (materialId) => {
                if(materialId == "null\n") materialId = null;
                this._handleMaterialSelection(materialId);
            }, () => {
                this._selectNewMaterial();
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        };
        this._editButton.onClickAndTouch = () => {
            if(!this._lastValue) return;
            let material = MaterialsHandler.getAsset(this._lastValue);
            let materialPage = global.menuController.getPage(
                MenuPages.MATERIAL);
            materialPage.setAsset(material);
            global.menuController.pushPage(MenuPages.MATERIAL);
        };
    }

    _selectNewMaterial() {
        let currentPage = global.menuController.getCurrentPage();
        let newMaterialPage = global.menuController.getPage(
            MenuPages.NEW_MATERIAL);
        newMaterialPage.setContent((material) => {
            this._handleMaterialSelection(material.id, currentPage);
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
    }

    _updateMaterial(materialId) {
        this._lastValue = materialId;
        let materialAsset = MaterialsHandler.getAsset(this._lastValue);
        let materialName = materialAsset
            ? materialAsset.name
            : " ";
        materialName = stringWithMaxLength(materialName, 12);
        this._materialSelection.textComponent.text = materialName;
        if(materialAsset) {
            let color = materialAsset.material.color || Colors.white;
            this._updateTextureAndColor(materialAsset.getSampleTexture(),color);
            this._buttonsSpan.add(this._editButton);
        } else {
            this._updateTextureAndColor(null, Colors.defaultIdle);
            this._buttonsSpan.remove(this._editButton);
        }
    }

    _updateTextureAndColor(texture, color) {
        let material = this._materialSelection.material;
        if(material.map?.image != texture?.image)
            this._materialSelection.updateTexture(texture);
        if(!material.color.equals(color))
            this._materialColorStyle.materialColor = color;
        material.color.getHSL(HSL);
        let fontColor = (!texture && HSL.l > 0.85)
            ? Colors.black
            : Colors.white;
        if(!this._materialSelection.textComponent.color.equals(fontColor))
            this._materialSelection.textComponent.color = fontColor;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_UPDATED, (message) => {
            if(this._lastValue == message.asset.id)
                this.updateFromSource();
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_UPDATED);
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        this._updateMaterial(this._getFromSource());
    }

    _onAdded() {
        this.updateFromSource();
        this._addSubscriptions();
        super._onAdded();
    }

    _onRemoved() {
        this._removeSubscriptions();
        super._onRemoved();
    }
}

export default MaterialField;
