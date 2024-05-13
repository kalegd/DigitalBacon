/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Styles, Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';
import { Div, Span, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const OPTIONS = 5;

class PaginatedListPage extends PaginatedPage {
    constructor(controller, hasBackButton) {
        super(controller, hasBackButton);
        this._paginatedListRows = [];
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
            let row = new Span({
                height: 0.035,
                justifyContent: 'spaceBetween',
                margin: 0.004,
                width: 0.3
            });
            let textBlock = new Text('', Styles.bodyText, {
                height: 0.035,
                width: 0.21,
            });
            let editButton = createSmallButton(Textures.pencilIcon, 0.7);
            let deleteButton = createSmallButton('X');
            row.title = textBlock;
            row.add(textBlock);
            row.add(editButton);
            row.add(deleteButton);
            this._optionsBlock.add(row);
            this._paginatedListRows.push(row);
            editButton.onClickAndTouch = () => {
                let index = this._page * OPTIONS + i;
                if(this._items.length > index) {
                    this._handleEditItemInteraction(this._items[index]);
                } else {
                    console.error(
                        "PaginatedListPage displaying non existant option");
                }
            };
            deleteButton.onClickAndTouch = () => {
                let index = this._page * OPTIONS + i;
                if(this._items.length > index) {
                    this._handleDeleteItemInteraction(this._items[index]);
                } else {
                    console.error(
                        "PaginatedListPage displaying non existant option");
                }
            };
        }
        this._optionsContainer.add(this._previousButtonParent);
        this._optionsContainer.add(this._optionsBlock);
        this._optionsContainer.add(this._nextButtonParent);
        this.add(this._optionsContainer);
    }

    _updateItemsGUI() {
        let firstIndex = this._page * OPTIONS;
        for(let i = 0; i < OPTIONS; i++) {
            let row = this._paginatedListRows[i];
            let title = row.children[1];
            if(firstIndex + i < this._items.length) {
                let item = this._items[firstIndex + i];
                row.title.text = this._getItemName(item);
                if(!row.parentComponent) this._optionsBlock.add(row);
            } else {
                if(row.parentComponent) row.parentComponent.remove(row);
            }
        }
        this._updatePreviousAndNextButtons(firstIndex + OPTIONS)
    }

    //Needs to be overridden
    _getItemName() {
        console.error("PaginatedListPage._getItemName() should be overridden");
        return "";
    }

    //Needs to be overridden
    _handleEditItemInteraction() {
        console.error(
            "PaginatedListPage._handleEditItemInteraction() should be overridden");
        return;
    }

    //Needs to be overridden
    _handleDeleteItemInteraction() {
        console.error(
            "PaginatedListPage._handleDeleteItemInteraction() should be overridden"
        );
        return;
    }

    //Needs to be overridden
    _refreshItems() {
        console.error("PaginatedListPage._refreshItems() should be overridden");
        return;
    }

    _onAdded() {
        super._onAdded();
        this._refreshItems();
        this._updateItemsGUI();
    }

}

export default PaginatedListPage;
