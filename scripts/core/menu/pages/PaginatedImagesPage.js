/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import { Colors, Fonts, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const ROWS = 2;
const OPTIONS = 3;

class PaginatedIconsPage extends MenuPage {
    constructor(controller, hasBackButton) {
        super(controller, hasBackButton);
        this._paginatedListButtons = [];
        this._paginatedListInteractables = [];
        this._page = 0;
        this._optionsInteractable = PointerInteractable.emptyGroup();
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
        let params = {
            'height': 0.17,
            'width': 0.31,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        };
        this._optionsBlock = new ThreeMeshUI.Block(params);
        params['height'] = 0.085;
        params['contentDirection'] = 'row';
        params['justifyContent'] = 'center';
        params['margin'] = 0.005;
        this._rows = [];
        this._rows.push(new ThreeMeshUI.Block(params));
        this._rows.push(new ThreeMeshUI.Block(params));
        for(let i = 0; i < ROWS; i++) {
            let row = this._rows[i];
            for(let j = 0; j < OPTIONS; j++) {
                let button = ThreeMeshUIHelper.createButtonBlock({
                    'height': 0.085,
                    'width': 0.1,
                    'margin': 0.002,
                    'justifyContent': 'start',
                    'idleBackgroundColor': Colors.white,
                    'hoveredBackgroundColor': Colors.white,
                    'selectedBackgroundColor': Colors.white,
                    'idleOpacity': 1,
                });
                let textBlock = ThreeMeshUIHelper.createTextBlock({
                    'text': ' ',
                    'height': 0.035,
                    'width': 0.1,
                    'margin': 0,
                });
                button.add(textBlock);
                row.add(button);
                this._paginatedListButtons.push(button);
                let interactable = new PointerInteractable(button, true);
                interactable.addAction(() => {
                    let index = this._page * ROWS * OPTIONS + OPTIONS * i + j;
                    if(this._items.length > index) {
                        this._handleItemInteraction(this._items[index]);
                    } else {
                        console.error(
                            "PaginatedIconsPage displaying non existant option");
                    }
                });
                this._optionsInteractable.addChild(interactable);
                this._paginatedListInteractables.push(interactable);
            }
        }
        this._optionsBlock.add(this._rows[0]);
        this._optionsBlock.add(this._rows[1]);
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
            this._previousButton, true);
        this._previousInteractable.addAction(() => {
            this._page -= 1;
            this._updateItemsGUI();
        });
        this._nextInteractable = new PointerInteractable(this._nextButton,true);
        this._nextInteractable.addAction(() => {
            this._page += 1;
            this._updateItemsGUI();
        });
        this._fetchNextInteractable = new PointerInteractable(this._nextButton,
            true);
        this._fetchNextInteractable.addAction(() => {
            this._page += 1;
            this._fetchNextItems();
            this._updateItemsGUI();
        });
    }

    _updateItemsGUI() {
        let firstIndex = this._page * ROWS * OPTIONS;
        for(let i = 0; i < ROWS * OPTIONS; i++) {
            let interactable = this._paginatedListInteractables[i];
            let button = this._paginatedListButtons[i];
            if(firstIndex + i < this._items.length) {
                let item = this._items[firstIndex + i];
                let image = this._getItemImage(item);
                button.set({ backgroundTexture: image });
                button.visible = true;
                this._optionsInteractable.addChild(interactable);
            } else {
                button.visible = false;
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
        if(this._items.length > firstIndex + ROWS * OPTIONS) {
            this._nextButton.visible = true;
            this._optionsInteractable.addChild(this._nextInteractable);
            this._optionsInteractable.removeChild(this._fetchNextInteractable);
        } else if(this._items.length == firstIndex + ROWS * OPTIONS
                && this._canFetchMore) {
            this._nextButton.visible = true;
            this._optionsInteractable.addChild(this._fetchNextInteractable);
            this._optionsInteractable.removeChild(this._nextInteractable);
        } else {
            this._nextButton.visible = false;
            this._optionsInteractable.removeChild(this._nextInteractable);
            this._optionsInteractable.removeChild(this._fetchNextInteractable);
        }
        //this._container.update(false, true, false);
    }

    //Needs to be overridden
    _getItemImage() {
        console.error(
            "PaginatedIconsPage._getItemImage() should be overridden");
        return "";
    }

    //Needs to be overridden
    _handleItemInteraction() {
        console.error(
            "PaginatedIconsPage._handleItemInteraction() should be overridden");
        return;
    }

    //Needs to be overridden
    _refreshItems() {
        console.error("PaginatedIconsPage._refreshItems() should be overridden");
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

export default PaginatedIconsPage;
