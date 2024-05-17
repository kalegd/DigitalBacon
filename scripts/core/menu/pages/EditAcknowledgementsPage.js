/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Span } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class EditAcknowledgementsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._page = 0;
        this._acknowledgements = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._createPreviousAndNextButtons();

        this._noAcknowledgements = new Div({ height: 0.035, width: 0.3 });

        this._addFirstAcknowledgement = createWideButton('Add Acknowledgement');
        this._addFirstAcknowledgement.onClickAndTouch =
            () => this._addAcknowledgement();

        this._noAcknowledgements.add(this._addFirstAcknowledgement);

        this._acknowledgementsContainer = new Span({
            height: 0.3,
            justifyContent: 'spaceEvenly',
            width: 0.45,
        });

        let columnBlock = new Div({
            height: 0.3,
            justifyContent: 'center',
            width: 0.31,
        });

        this._fields = [];
        for(let key of ['Asset', 'Author', 'License', 'Source URL']) {
            let field = new TextField({
                'title': key,
                'singleLine': true,
                'onBlur': (oldValue, newValue) => {
                    this._acknowledgements[this._page][key] = newValue;
                },
                'getFromSource': () =>
                    this._acknowledgements[this._page][key] || '',
            });
            columnBlock.add(field);
            this._fields.push(field);
        }

        this._createAddAndDeleteButtons(columnBlock);

        this.add(this._acknowledgementsContainer);
        this._acknowledgementsContainer.add(this._previousButtonParent);
        this._acknowledgementsContainer.add(columnBlock);
        this._acknowledgementsContainer.add(this._nextButtonParent);
    }

    _createPreviousAndNextButtons() {
        this._previousButtonParent = new Div();
        this._previousButton = createSmallButton('<');
        this._previousButton.onClickAndTouch = () => {
            this._page += this._acknowledgements.length - 1;
            this._page %= this._acknowledgements.length;
            this._setAsset();
        };
        this._previousButtonParent.add(this._previousButton);
        this._nextButtonParent = new Div();
        this._nextButton = createSmallButton('>');
        this._nextButton.onClickAndTouch = () => {
            this._page += 1;
            this._page %= this._acknowledgements.length;
            this._setAsset();
        };
        this._nextButtonParent.add(this._nextButton);
    }

    _createAddAndDeleteButtons(columnBlock) {
        let addDeleteRow = new Span({
            height: 0.035,
            justifyContent: 'spaceBetween',
            width: 0.088,
        });

        let addButton = createSmallButton('+');
        let deleteButton = createSmallButton(Textures.trashIcon, 0.7);
        addDeleteRow.add(addButton);
        addDeleteRow.add(deleteButton);
        columnBlock.add(addDeleteRow);

        addButton.onClickAndTouch = () => this._addAcknowledgement();
        deleteButton.onClickAndTouch = () => this._deleteAcknowledgement();
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
                this._previousButtonParent.add(this._previousButton);
                this._nextButtonParent.add(this._nextButton);
            } else {
                this._previousButtonParent.remove(this._previousButton);
                this._nextButtonParent.remove(this._nextButton);
            }
            this.add(this._acknowledgementsContainer);
            this.remove(this._noAcknowledgements);
        } else {
            this.remove(this._acknowledgementsContainer);
            this.add(this._noAcknowledgements);
            return;
        }
        this._setAsset();
    }

    _setAsset() {
        for(let field of this._fields) {
            field.updateFromSource();
        }
    }

    _onAdded() {
        this._refreshAssets();
        super._onAdded();
    }
}

export default EditAcknowledgementsPage;
