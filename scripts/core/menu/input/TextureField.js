/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import TexturesHandler from '/scripts/core/handlers/assetTypes/TexturesHandler.js';
import { Colors, Textures } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createSmallButton, createWideImageButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { Span, Style } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class TextureField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        this._filter =  params['filter'];
        let title = params['title'] || 'Missing Field Name...';
        this._privateIds = params['privateIds'] || new Set();
        this._createInputs(title);
        this._updateTexture(this._lastValue);
    }

    _createInputs(title) {
        this._addTitle(title);
        this._buttonsSpan = new Span({ height: 0.03, width: 0.17 });
        this._textureColorStyle = new Style({ materialColor: 0xffffff });
        this._textureSelection = createWideImageButton('');
        this._textureSelection.addStyle(this._textureColorStyle);
        this._textureSelection.textComponent.fontSize = 0.017;
        this._textureSelection.height = 0.03;
        this._textureSelection.width = 0.13;
        this._editButton = createSmallButton(Textures.pencilIcon);
        this._editButton.marginLeft = 0.01;
        this._editButton.height = 0.03;
        this._editButton.width = 0.03;
        this._buttonsSpan.add(this._textureSelection);
        this._buttonsSpan.add(this._editButton);
        this.add(this._buttonsSpan);
        this._textureSelection.onClickAndTouch = () => {
            let textures = TexturesHandler.getAssets();
            let filteredTextures = {};
            filteredTextures["null\n"] = { Name: "Blank" };
            for(let textureId in textures) {
                if(this._filter &&
                        !this._filter.includes(textures[textureId].textureType))
                    continue;
                let texture = textures[textureId];
                if((texture.isPrivate || texture.constructor.isPrivate)
                    && !this._privateIds.has(textureId)) continue;
                filteredTextures[textureId] = { Name: texture.name };
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredTextures, (textureId) => {
                if(textureId == "null\n") textureId = null;
                this._handleTextureSelection(textureId);
            }, () => {
                this._selectNewTexture();
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        };
        this._editButton.onClickAndTouch = () => {
            if(!this._lastValue) return;
            let texture = TexturesHandler.getAsset(this._lastValue);
            let texturePage = global.menuController.getPage(
                MenuPages.TEXTURE);
            texturePage.setAsset(texture);
            global.menuController.pushPage(MenuPages.TEXTURE);
        };
    }

    _selectNewTexture() {
        let currentPage = global.menuController.getCurrentPage();
        let options = TexturesHandler.getAssetClasses();
        if(this._filter)
            options = options.filter(o => this._filter.includes(o.textureType));
        if(options.length == 1) {
            let texture = TexturesHandler.addNewAsset(options[0].assetId);
            this._handleTextureSelection(texture.id);
            let texturePage = global.menuController.getPage(
                MenuPages.TEXTURE);
            texturePage.setAsset(texture);
            global.menuController.pushPage(MenuPages.TEXTURE);
        } else {
            let newTexturePage = global.menuController.getPage(
                MenuPages.NEW_TEXTURE);
            newTexturePage.setContent((texture) => {
                this._handleTextureSelection(texture.id, currentPage);
                if(currentPage != global.menuController.getCurrentPage())return;
                let texturePage = global.menuController.getPage(
                    MenuPages.TEXTURE);
                texturePage.setAsset(texture);
                global.menuController.pushPage(MenuPages.TEXTURE);
            });
            global.menuController.pushPage(MenuPages.NEW_TEXTURE);
        }
    }

    _handleTextureSelection(textureId, callingPage) {
        if(textureId == "null\n") textureId = null;
        if(this._lastValue != textureId) {
            if(this._onUpdate) this._onUpdate(textureId);
            this._updateTexture(textureId);
        }
        if(!callingPage || callingPage ==global.menuController.getCurrentPage())
            global.menuController.back();
    }

    _updateTexture(textureId) {
        this._lastValue = textureId;
        let texture = TexturesHandler.getAsset(this._lastValue);
        let textureName = texture
            ? texture.name
            : " ";
        textureName = stringWithMaxLength(textureName, 12);
        this._textureSelection.textComponent.text = textureName;
        if(texture) {
            this._updateTextureAndColor(texture.previewTexture,
                Colors.white);
            this._buttonsSpan.add(this._editButton);
        } else {
            this._updateTextureAndColor(null, Colors.defaultIdle);
            this._buttonsSpan.remove(this._editButton);
        }
    }

    _updateTextureAndColor(texture, color) {
        let material = this._textureSelection.material;
        if(material.map?.image != texture?.image)
            this._textureSelection.updateTexture(texture);
        if(!material.color.equals(color))
            this._textureColorStyle.materialColor = color;
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        this._updateTexture(this._getFromSource());
    }
}

export default TextureField;
