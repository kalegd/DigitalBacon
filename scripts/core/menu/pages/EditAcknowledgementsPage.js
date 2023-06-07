/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import TextInput from '/scripts/core/menu/input/TextInput.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';
import { TextureLoader } from 'three';

class EditAcknowledgementsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._page = 0;
        this._acknowledgements = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._createPreviousAndNextButtons();

        this._noAcknowledgements = new ThreeMeshUI.Block({
            'backgroundOpacity': 0,
            'height': 0.035,
            'width': 0.3,
            'offset': 0,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });

        this._addFirstAcknowledgement = ThreeMeshUIHelper.createButtonBlock({
            'text': 'Add Acknowledgement',
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'margin': 0,
        });
        this._addFirstInteractable = new PointerInteractable(
            this._addFirstAcknowledgement, () => this._addAcknowledgement() );

        this._noAcknowledgements.add(this._addFirstAcknowledgement);

        this._acknowledgementsContainer = new ThreeMeshUI.Block({
            'height': 0.3,
            'width': 0.45,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'offset': 0,
        });

        this._acknowledgementsInteractable = PointerInteractable.emptyGroup();

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.3,
            'width': 0.31,
            'contentDirection': 'column',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
        });

        this._fields = [];
        for(let key of ['Asset', 'Author', 'License', 'Source URL']) {
            let field = new TextInput({
                'title': key,
                'onBlur': (oldValue, newValue) => {
                    this._acknowledgements[this._page][key] = newValue;
                },
                'getFromSource': () => {
                    return this._acknowledgements[this._page][key] || '';
                },
            });
            field.addToScene(columnBlock, this._acknowledgementsInteractable);
            this._fields.push(field);
        }

        this._createAddAndDeleteButtons(columnBlock);

        this._container.add(this._acknowledgementsContainer);
        this._acknowledgementsContainer.add(this._previousButton);
        this._acknowledgementsContainer.add(columnBlock);
        this._acknowledgementsContainer.add(this._nextButton);
    }

    _createPreviousAndNextButtons() {
        this._previousButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '<',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._nextButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '>',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._previousInteractable = new PointerInteractable(
            this._previousButton,
            () => {
                this._page += this._acknowledgements.length - 1;
                this._page %= this._acknowledgements.length;
                this._setAsset();
            });
        this._nextInteractable = new PointerInteractable(this._nextButton,
            () => {
                this._page += 1;
                this._page %= this._acknowledgements.length;
                this._setAsset();
            });
    }

    _createAddAndDeleteButtons(columnBlock) {
        let addDeleteRow = new ThreeMeshUI.Block({
            'height': 0.035,
            'width': 0.4,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'offset': 0,
        });

        this._addButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '+',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._deleteButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.trashIcon,
            'backgroundTextureScale': 0.7,
            'height': 0.04,
            'width': 0.04,
        });
        addDeleteRow.add(this._addButton);
        addDeleteRow.add(this._deleteButton);
        columnBlock.add(addDeleteRow);

        this._addInteractable = new PointerInteractable(
            this._addButton, () => this._addAcknowledgement() );
        this._deleteInteractable = new PointerInteractable(this._deleteButton,
            () => { this._deleteAcknowledgement(); });
        this._acknowledgementsInteractable.addChild(this._addInteractable);
        this._acknowledgementsInteractable.addChild(this._deleteInteractable);
    }

    _addAcknowledgement() {
        this._acknowledgements.push({
            'Asset': '',
            'Author': '',
            'License': '',
            'Source URL': '',
        });
        this._page = this._acknowledgements.length - 1;
        this._refreshAssets();
    }

    _deleteAcknowledgement() {
        this._acknowledgements.splice(this._page, 1);
        this._page = Math.min(this._page, this._acknowledgements.length);
        this._refreshAssets();
    }

    _refreshAssets() {
        this._acknowledgements = SettingsHandler.getAcknowledgements();
        if(this._acknowledgements.length > 0) {
            if(this._page >= this._acknowledgements.length) this._page = 0;
            if(this._acknowledgements.length > 1) {
                this._previousButton.visible = true;
                this._nextButton.visible = true;
                this._acknowledgementsInteractable.addChild(
                    this._previousInteractable);
                this._acknowledgementsInteractable.addChild(
                    this._nextInteractable);
            } else {
                this._previousButton.visible = false;
                this._nextButton.visible = false;
                this._acknowledgementsInteractable.removeChild(
                    this._previousInteractable);
                this._acknowledgementsInteractable.removeChild(
                    this._nextInteractable);
            }
            this._container.add(this._acknowledgementsContainer);
            this._container.remove(this._noAcknowledgements);
            this._containerInteractable.addChild(
                this._acknowledgementsInteractable);
            this._containerInteractable.removeChild(this._addFirstInteractable);
        } else {
            this._container.remove(this._acknowledgementsContainer);
            this._container.add(this._noAcknowledgements);
            this._containerInteractable.removeChild(
                this._acknowledgementsInteractable);
            this._containerInteractable.addChild(this._addFirstInteractable);
            return;
        }
        this._setAsset();
    }

    _setAsset() {
        for(let field of this._fields) {
            field.updateFromSource();
        }
    }

    addToScene(scene, parentInteractable) {
        this._refreshAssets();
        super.addToScene(scene, parentInteractable);
    }
}

export default EditAcknowledgementsPage;
