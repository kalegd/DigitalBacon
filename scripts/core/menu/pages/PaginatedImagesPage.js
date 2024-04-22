/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import { Styles, Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Image, Span } from '/scripts/DigitalBacon-UI.js';

const ROWS = 2;
const OPTIONS = 3;

class PaginatedImagesPage extends MenuPage {
    constructor(controller, hasBackButton) {
        super(controller, hasBackButton);
        this._paginatedListButtons = [];
        this._page = 0;
    }

    _addList() {
        this._createPreviousAndNextButtons();
        this._optionsContainer = new Span({
            height: 0.2,
            justifyContent: 'spaceEvenly',
            width: 0.45,
        });
        this._optionsBlock = new Div({
            height: 0.178,
            justifyContent: 'spaceBetween',
        });
        let params = {
            height: 0.085,
            width: 0.316,
            justifyContent: 'spaceBetween',
        };
        this._rows = [];
        this._rows.push(new Span(params));
        this._rows.push(new Span(params));
        for(let i = 0; i < ROWS; i++) {
            let row = this._rows[i];
            for(let j = 0; j < OPTIONS; j++) {
                let button = new Image(Textures.ellipsisIcon, {
                    borderRadius: 0.01,
                    height: 0.085,
                    justifyContent: 'spaceEvenly',
                    textureFit: 'cover',
                    width: 0.1,
                });
                button.pointerInteractable = new PointerInteractable(button);
                row.add(button);
                this._paginatedListButtons.push(button);
                button.onClickAndTouch = () => {
                    let index = this._page * ROWS * OPTIONS + OPTIONS * i + j;
                    if(this._items.length > index) {
                        this._handleItemInteraction(this._items[index]);
                    } else {
                        console.error(
                            "PaginatedImagesPage displaying non existant option"
                        );
                    }
                };
            }
        }
        this._optionsBlock.add(this._rows[0]);
        this._optionsBlock.add(this._rows[1]);
        this._optionsContainer.add(this._previousButtonParent);
        this._optionsContainer.add(this._optionsBlock);
        this._optionsContainer.add(this._nextButtonParent);
        this.add(this._optionsContainer);
    }

    _createPreviousAndNextButtons() {
        this._previousButtonParent = new Div();
        this._previousButton = createSmallButton('<');
        this._previousButton.onClickAndTouch = () => {
            this._page -= 1;
            this._updateItemsGUI();
        };
        this._previousButtonParent.add(this._previousButton);
        this._nextButtonParent = new Div();
        this._nextButton = createSmallButton('>');
        this._nextButton.onClickAndTouch = () => {
            this._page += 1;
            if(this._fetchNext) this._fetchNextItems();
            this._updateItemsGUI();
        };
        this._nextButtonParent.add(this._nextButton);
    }

    _updateItemsGUI() {
        let firstIndex = this._page * ROWS * OPTIONS;
        for(let i = 0; i < ROWS * OPTIONS; i++) {
            let button = this._paginatedListButtons[i];
            if(firstIndex + i < this._items.length) {
                let item = this._items[firstIndex + i];
                let image = this._getItemImage(item);
                button.updateTexture(image);
                if(!button.parentComponent)
                    this._rows[Math.floor(i / OPTIONS)].add(button);
            } else {
                if(button.parentComponent)button.parentComponent.remove(button);
            }
        }
        if(this._page == 0) {
            if(this._previousButton.parentComponent)
                this._previousButtonParent.remove(this._previousButton);
        } else if(!this._previousButton.parentComponent) {
            this._previousButtonParent.add(this._previousButton);
        }
        if(this._items.length > firstIndex + ROWS * OPTIONS) {
            if(!this._nextButton.parentComponent)
                this._nextButtonParent.add(this._nextButton);
            this._fetchNext = false;
        } else if(this._items.length == firstIndex + ROWS * OPTIONS
                && this._canFetchMore) {
            this._fetchNext = true;
        } else {
            if(this._nextButton.parentComponent)
                this._nextButtonParent.remove(this._nextButton);
            this._fetchNext = false;
        }
    }

    //Needs to be overridden
    _fetchNextItems() {
        console.error(
            "PaginatedImagesPage._fetchNextItems() should be overridden");
        return "";
    }

    //Needs to be overridden
    _getItemImage() {
        console.error(
            "PaginatedImagesPage._getItemImage() should be overridden");
        return "";
    }

    //Needs to be overridden
    _handleItemInteraction() {
        console.error(
            "PaginatedImagesPage._handleItemInteraction() should be overridden");
        return;
    }

    //Needs to be overridden
    _refreshItems() {
        console.error("PaginatedImagesPage._refreshItems() should be overridden");
        return;
    }

    _onAdded() {
        super._onAdded();
        this._refreshItems();
        this._updateItemsGUI();
    }

}

export default PaginatedImagesPage;
