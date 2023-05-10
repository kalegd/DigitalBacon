/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import InteractableStates from '/scripts/core/enums/InteractableStates.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.13;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 9;

const STATE_COLORS = {};
STATE_COLORS[InteractableStates.IDLE] = Colors.defaultIdle;
STATE_COLORS[InteractableStates.HOVERED] = Colors.defaultHovered;
STATE_COLORS[InteractableStates.SELECTED] = Colors.defaultHovered;

class TextureInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._onUpdate = params['onUpdate'];
        this._lastValue =  params['initialValue'];
        this._filter =  params['filter'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
        this._updateTexture(this._lastValue);
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
        this._textureSelection = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
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
        this._object.add(this._textureSelection);
        this._object.add(this._editButton);
        let interactable = new PointerInteractable(this._textureSelection, () => {
            let textures = TexturesHandler.getAssets();
            let filteredTextures = {};
            filteredTextures["null\n"] = { Name: "Blank" };
            for(let textureId in textures) {
                if(this._filter &&
                        this._filter != textures[textureId].getTextureType()) {
                    continue;
                }
                filteredTextures[textureId] =
                    { Name: textures[textureId].getName() };
            }
            let page = global.menuController.getPage(MenuPages.ASSET_SELECT);
            page.setContent(filteredTextures, (textureId) => {
                if(textureId == "null\n") textureId = null;
                this._handleTextureSelection(textureId);
            }, () => {
                this._selectNewTexture();
            });
            global.menuController.pushPage(MenuPages.ASSET_SELECT);
        });
        this._editInteractable = new PointerInteractable(this._editButton, () => {
            if(!this._lastValue) return;
            let texture = TexturesHandler.getAsset(this._lastValue);
            let texturePage = global.menuController.getPage(
                MenuPages.TEXTURE);
            texturePage.setTexture(texture);
            global.menuController.pushPage(MenuPages.TEXTURE);
        });
        this._pointerInteractable.addChild(interactable);
    }

    _selectNewTexture() {
        if(this._filter) {
            let texture = TexturesHandler.addNewAsset(this._filter)
            this._handleTextureSelection(texture.getId());
            let texturePage = global.menuController.getPage(
                MenuPages.TEXTURE);
            texturePage.setTexture(texture);
            global.menuController.pushPage(MenuPages.TEXTURE);
        } else {
            let newTexturePage = global.menuController.getPage(
                MenuPages.NEW_TEXTURE);
            newTexturePage.setContent((texture) => {
                this._handleTextureSelection(texture.getId());
                let texturePage = global.menuController.getPage(
                    MenuPages.TEXTURE);
                texturePage.setTexture(texture);
                global.menuController.pushPage(MenuPages.TEXTURE);
            });
            global.menuController.pushPage(MenuPages.NEW_TEXTURE);
        }
    }

    _handleTextureSelection(textureId) {
        if(textureId == "null\n") textureId = null;
        if(this._lastValue != textureId) {
            if(this._onUpdate) this._onUpdate(textureId);
            this._updateTexture(textureId);
        }
        global.menuController.back();
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id,
            'targetOnlyMenu': true,
        });
    }

    _updateTexture(textureId) {
        this._lastValue = textureId;
        let texture = TexturesHandler.getAsset(this._lastValue);
        let textureName = texture
            ? texture.getName()
            : " ";
        textureName = stringWithMaxLength(textureName, FIELD_MAX_LENGTH);
        let textComponent = this._textureSelection.children[1];
        textComponent.set({ content: textureName });
        if(texture) {
            for(let interactableState in InteractableStates) {
                let state = this._textureSelection.states[interactableState];
                state.attributes.backgroundColor = Colors.white;
            }
            this._updateTextureAndColor(texture.getPreviewTexture(),
                Colors.white);
            this._pointerInteractable.addChild(this._editInteractable);
            this._editButton.visible = true;
        } else {
            for(let interactableState in InteractableStates) {
                let state = this._textureSelection.states[interactableState];
                state.attributes.backgroundColor =
                    STATE_COLORS[interactableState];
            }
            this._updateTextureAndColor(null, Colors.defaultIdle);
            this._pointerInteractable.removeChild(this._editInteractable);
            this._editButton.visible = false;
        }
    }

    _updateTextureAndColor(texture, color) {
        if(this._textureSelection.backgroundTexture != texture)
            this._textureSelection.set({ backgroundTexture: texture });
        if(this._textureSelection.backgroundColor != color)
            this._textureSelection.set({ backgroundColor: color });
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
        this._updateTexture(this._getFromSource());
    }
}

export default TextureInput;
