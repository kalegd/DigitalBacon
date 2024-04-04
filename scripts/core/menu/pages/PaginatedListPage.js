/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import { Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const OPTIONS = 5;

class PaginatedPage extends MenuPage {
    constructor(controller, hasBackButton) {
        super(controller, hasBackButton);
        this._paginatedListRows = [];
        this._paginatedListInteractables = [];
        this._page = 0;
        this._optionsInteractable = new PointerInteractable();
    }

    _addList() {
        this._createPreviousAndNextButtons();
        this._optionsContainer = new ThreeMeshUI.Block({
            'height': 0.17,
            'width': 0.45,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        this._optionsBlock = new ThreeMeshUI.Block({
            'height': 0.17,
            'width': 0.31,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        for(let i = 0; i < OPTIONS; i++) {
            let row = new ThreeMeshUI.Block({
                'height': 0.035,
                'width': 0.3,
                'margin': 0.002,
                'contentDirection': 'row',
                'justifyContent': 'start',
                'backgroundOpacity': 0,
            });
            let textBlock = ThreeMeshUIHelper.createTextBlock({
                'text': ' ',
                'fontSize': FontSizes.body,
                'height': 0.035,
                'width': 0.21,
                'margin': 0.002,
                'fontFamily': Fonts.defaultFamily,
                'fontTexture': Fonts.defaultTexture,
            });
            let editButton = ThreeMeshUIHelper.createButtonBlock({
                'backgroundTexture': Textures.pencilIcon,
                'backgroundTextureScale': 0.7,
                'height': 0.04,
                'width': 0.04,
                'margin': 0.002,
            });
            let deleteButton = ThreeMeshUIHelper.createButtonBlock({
                'text': 'X',
                'fontSize': 0.03,
                'height': 0.04,
                'width': 0.04,
                'margin': 0.002,
                'fontFamily': Fonts.defaultFamily,
                'fontTexture': Fonts.defaultTexture,
            });
            row.add(textBlock);
            row.add(editButton);
            row.add(deleteButton);
            this._optionsBlock.add(row);
            this._paginatedListRows.push(row);
            let interactableParent = new PointerInteractable();
            let interactable = new PointerInteractable(editButton);
            interactable.addEventListener('click', () => {
                let index = this._page * OPTIONS + i;
                if(this._items.length > index) {
                    this._handleEditItemInteraction(this._items[index]);
                } else {
                    console.error(
                        "PaginatedPage displaying non existant option");
                }
            });
            interactableParent.addChild(interactable);
            interactable = new PointerInteractable(deleteButton);
            interactable.addEventListener('click', () => {
                let index = this._page * OPTIONS + i;
                if(this._items.length > index) {
                    this._handleDeleteItemInteraction(this._items[index]);
                } else {
                    console.error(
                        "PaginatedPage displaying non existant option");
                }
            });
            interactableParent.addChild(interactable);
            this._optionsInteractable.addChild(interactableParent);
            this._paginatedListInteractables.push(interactableParent);
        }
        this._optionsContainer.add(this._previousButton);
        this._optionsContainer.add(this._optionsBlock);
        this._optionsContainer.add(this._nextButton);
        this._container.add(this._optionsContainer);
        this._containerInteractable.addChild(this._optionsInteractable);
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
            this._previousButton);
        this._previousInteractable.addEventListener('click', () => {
            this._page -= 1;
            this._updateItemsGUI();
        });
        this._nextInteractable = new PointerInteractable(this._nextButton);
        this._nextInteractable.addEventListener('click', () => {
            this._page += 1;
            this._updateItemsGUI();
        });
    }

    _updateItemsGUI() {
        let firstIndex = this._page * OPTIONS;
        for(let i = 0; i < OPTIONS; i++) {
            let interactable = this._paginatedListInteractables[i];
            let row = this._paginatedListRows[i];
            let title = row.children[1];
            if(firstIndex + i < this._items.length) {
                let item = this._items[firstIndex + i];
                title.children[1].set({ content: this._getItemName(item) });
                row.visible = true;
                this._optionsInteractable.addChild(interactable);
            } else {
                row.visible = false;
                this._optionsInteractable.removeChild(interactable);
            }
        }
        if(this._page == 0) {
            this._previousButton.visible = false;
            this._optionsInteractable.removeChild(this._previousInteractable);
        } else {
            this._previousButton.visible = true;
            this._optionsInteractable.addChild(this._previousInteractable);
        }
        if(this._items.length > firstIndex + OPTIONS) {
            this._nextButton.visible = true;
            this._optionsInteractable.addChild(this._nextInteractable);
        } else {
            this._nextButton.visible = false;
            this._optionsInteractable.removeChild(this._nextInteractable);
        }
        //this._container.update(false, true, false);
    }

    //Needs to be overridden
    _getItemName() {
        console.error("PaginatedPage._getItemName() should be overridden");
        return "";
    }

    //Needs to be overridden
    _handleEditItemInteraction() {
        console.error(
            "PaginatedPage._handleEditItemInteraction() should be overridden");
        return;
    }

    //Needs to be overridden
    _handleDeleteItemInteraction() {
        console.error(
            "PaginatedPage._handleDeleteItemInteraction() should be overridden"
        );
        return;
    }

    //Needs to be overridden
    _refreshItems() {
        console.error("PaginatedPage._refreshItems() should be overridden");
        return;
    }

    addToScene(scene, interactableParent) {
        super.addToScene(scene, interactableParent);
        if(scene) {
            this._refreshItems();
            this._updateItemsGUI();
        }
    }

}

export default PaginatedPage;
