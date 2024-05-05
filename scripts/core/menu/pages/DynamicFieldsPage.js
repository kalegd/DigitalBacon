/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Styles } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Span, Text } from '/scripts/DigitalBacon-UI.js';

const FIELDS_CONTAINER_HEIGHT = 0.22;

class DynamicFieldsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._firstItemIndex = 0;
        this._lastItemIndex = -1;
        this._fields = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._createPreviousAndNextButtons();
        this._createTitleBlock();
        let rowBlock = new Span({
            height: FIELDS_CONTAINER_HEIGHT,
            justifyContent: 'spaceEvenly',
            width:0.45,
        });
        this._fieldsContainer = new Div({
            height: FIELDS_CONTAINER_HEIGHT,
            justifyContent: 'spaceBetween',
            width: 0.31,
        });
        rowBlock.add(this._previousButtonParent);
        rowBlock.add(this._fieldsContainer);
        rowBlock.add(this._nextButtonParent);
        this.add(this._titleBlock);
        this.add(rowBlock);
    }

    _createTitleBlock() {
        this._titleBlock = new Text('', Styles.title);
        this.add(this._titleBlock);
    }

    _createPreviousAndNextButtons() {
        this._previousButtonParent = new Div();
        this._previousButton = createSmallButton('<');
        this._previousButton.onClickAndTouch = () => this._loadPrevPage();
        this._previousButtonParent.add(this._previousButton);
        this._nextButtonParent = new Div();
        this._nextButton = createSmallButton('>');
        this._nextButton.onClickAndTouch = () => this._loadNextPage();
        this._nextButtonParent.add(this._nextButton);
    }

    _setFields(fields) {
        this._removeCurrentFields();
        this._firstItemIndex = 0;
        this._lastItemIndex = -1;
        this._fields = fields;
        this._loadNextPage();

        for(let field of fields) {
            field.updateFromSource();
        }
    }

    _removeField(field) {
        let index = this._fields.indexOf(field);
        field.deactivate();
        this._fieldsContainer.remove(field);
        this._fields.splice(index, 1);
        if(index <= this._lastItemIndex) {
            if(index < this._firstItemIndex) {
                this._firstItemIndex--;
            }
            this._lastItemIndex--;
            if(this._firstItemIndex == this._fields.length) {
                this._loadPrevPage();
            } else {
                this._removeCurrentFields();
                this._lastItemIndex = this._firstItemIndex - 1;
                this._loadNextPage();
            }
        } else if(this._fields.length == this._lastItemIndex + 1) {
            this._updateNavButtons();
        }
    }

    _loadNextPage() {
        this._removeCurrentFields();
        this._firstItemIndex = this._lastItemIndex + 1;
        let availableHeight = FIELDS_CONTAINER_HEIGHT;
        for(let i = this._firstItemIndex; i < this._fields.length; i++) {
            let field = this._fields[i];
            availableHeight -= field.computedHeight;
            //Allow oversized fields if it's the first field
            if(availableHeight >= 0 || i == this._firstItemIndex) {
                this._fieldsContainer.add(field);
                this._lastItemIndex = i;
            } else {
                break;
            }
        }
        this._updateNavButtons();
    }

    _loadPrevPage() {
        this._removeCurrentFields();
        let availableHeight = FIELDS_CONTAINER_HEIGHT;
        this._lastItemIndex = this._firstItemIndex - 1;
        let pendingFields = [];
        for(let i = this._lastItemIndex; i >= 0; i--) {
            let field = this._fields[i];
            availableHeight -= field.computedHeight;
            //Allow oversized fields if it's the first field
            if(availableHeight >= 0 || i == this._lastItemIndex) {
                pendingFields.push(field);
                this._firstItemIndex = i;
            } else {
                break;
            }
        }
        for(let i = pendingFields.length -1; i >= 0; i--) {
            this._fieldsContainer.add(pendingFields[i]);
        }
        this._updateNavButtons();
    }

    _updateNavButtons() {
        if(this._firstItemIndex == 0) {
            this._previousButtonParent.remove(this._previousButton);
        } else if(!this._previousButton.parentComponent) {
            this._previousButtonParent.add(this._previousButton);
        }
        if(this._lastItemIndex + 1 == this._fields.length) {
            this._nextButtonParent.remove(this._nextButton);
        } else if(!this._nextButton.parentComponent) {
            this._nextButtonParent.add(this._nextButton);
        }
    }

    _removeCurrentFields() {
        for(let i = this._firstItemIndex; i <= this._lastItemIndex; i++) {
            let field = this._fields[i];
            field.deactivate();
            this._fieldsContainer.remove(field);
        }
    }

    _unfocusFields() {
        for(let i = this._firstItemIndex; i <= this._lastItemIndex; i++) {
            this._fields[i].deactivate();
        }
    }
}

export default DynamicFieldsPage;
