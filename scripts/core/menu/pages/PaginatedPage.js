/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import { createSmallButton, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Span } from '/scripts/DigitalBacon-UI.js';

const OPTIONS = 5;

class PaginatedPage extends MenuPage {
    constructor(controller, hasBackButton) {
        super(controller, hasBackButton);
        this._paginatedListButtons = [];
        this._page = 0;
    }

    _addList() {
        this._createPreviousAndNextButtons();
        this._optionsContainer = new Span({
            height: 0.215,
            justifyContent: 'spaceEvenly',
            width: 0.45,
        });
        this._optionsBlock = new Div({
            height: 0.215,
        });
        for(let i = 0; i < OPTIONS; i++) {
            let button = createWideButton();
            button.marginTop = 0.004;
            button.marginBottom = 0.004;
            button.onClick = () => {
                let index = this._page * OPTIONS + i;
                if(this._items.length > index) {
                    this._handleItemInteraction(this._items[index]);
                } else {
                    console.error(
                        "PaginatedPage displaying non existant option");
                }
            };
            this._optionsBlock.add(button);
            this._paginatedListButtons.push(button);
        }
        this._optionsContainer.add(this._previousButtonParent);
        this._optionsContainer.add(this._optionsBlock);
        this._optionsContainer.add(this._nextButtonParent);
        this.add(this._optionsContainer);
    }

    _createPreviousAndNextButtons() {
        this._previousButtonParent = new Div();
        this._previousButton = createSmallButton('<');
        this._previousButton.onClick = () => {
            this._page -= 1;
            this._updateItemsGUI();
        };
        this._previousButtonParent.add(this._previousButton);
        this._nextButtonParent = new Div();
        this._nextButton = createSmallButton('>');
        this._nextButton.onClick = () => {
            this._page += 1;
            this._updateItemsGUI();
        };
        this._nextButtonParent.add(this._nextButton);
    }

    _updateItemsGUI() {
        let firstIndex = this._page * OPTIONS;
        for(let i = 0; i < OPTIONS; i++) {
            let button = this._paginatedListButtons[i];
            if(firstIndex + i < this._items.length) {
                let item = this._items[firstIndex + i];
                button.textComponent.text = this._getItemName(item);
                if(!button.parentComponent) this._optionsBlock.add(button);
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
        if(this._items.length > firstIndex + OPTIONS) {
            if(!this._nextButton.parentComponent)
                this._nextButtonParent.add(this._nextButton);
        } else if(this._nextButton.parentComponent) {
            this._nextButtonParent.remove(this._nextButton);
        }
    }

    //Needs to be overridden
    _getItemName() {
        console.error("PaginatedPage._getItemName() should be overridden");
        return "";
    }

    //Needs to be overridden
    _handleItemInteraction() {
        console.error(
            "PaginatedPage._handleItemInteraction() should be overridden");
        return;
    }

    //Needs to be overridden
    _refreshItems() {
        console.error("PaginatedPage._refreshItems() should be overridden");
        return;
    }

    _onAdded() {
        super._onAdded();
        this._refreshItems();
        this._updateItemsGUI();
    }

}

export default PaginatedPage;
