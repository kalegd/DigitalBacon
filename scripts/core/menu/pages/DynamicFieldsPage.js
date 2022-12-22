/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const FIELDS_CONTAINER_HEIGHT = 0.22;

class DynamicFieldsPage extends MenuPage {
    constructor(controller) {
        super(controller, false, true);
        this._firstItemIndex = 0;
        this._lastItemIndex = -1;
        this._fields = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._createPreviousAndNextButtons();
        this._createTitleBlock();
        let rowBlock = new ThreeMeshUI.Block({
            'height': FIELDS_CONTAINER_HEIGHT,
            'width': 0.45,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'margin': 0,
            'offset': 0,
        });
        this._fieldsContainer = new ThreeMeshUI.Block({
            'height': FIELDS_CONTAINER_HEIGHT,
            'width': 0.31,
            'contentDirection': 'column',
            'justifyContent': 'space-around',
            'backgroundOpacity': 0,
            'margin': 0,
            'offset': 0,
        });
        rowBlock.add(this._previousButton);
        rowBlock.add(this._fieldsContainer);
        rowBlock.add(this._nextButton);
        this._container.add(this._titleBlock);
        this._container.add(rowBlock);
    }

    _createTitleBlock() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
            'offset': 0,
        });
    }

    _createPreviousAndNextButtons() {
        this._previousButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '<',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
        });
        this._nextButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '>',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
        });
        this._previousInteractable = new PointerInteractable(
            this._previousButton,
            () => {
                this._loadPrevPage();
            });
        this._nextInteractable = new PointerInteractable(this._nextButton,
            () => {
                this._loadNextPage();
            });
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
        field.removeFromScene();
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
            availableHeight -= field.getHeight();
            //Allow oversized fields if it's the first field
            if(availableHeight >= 0 || i == this._firstItemIndex) {
                field.addToScene(this._fieldsContainer,
                    this._containerInteractable);
                this._lastItemIndex = i;
            } else {
                break;
            }
        }
        this._updateNavButtons();
        this._container.update(true, true, false);
    }

    _loadPrevPage() {
        this._removeCurrentFields();
        let availableHeight = FIELDS_CONTAINER_HEIGHT;
        this._lastItemIndex = this._firstItemIndex - 1;
        let pendingFields = [];
        for(let i = this._lastItemIndex; i >= 0; i--) {
            let field = this._fields[i];
            availableHeight -= field.getHeight();
            //Allow oversized fields if it's the first field
            if(availableHeight >= 0 || i == this._lastItemIndex) {
                pendingFields.push(field);
                this._firstItemIndex = i;
            } else {
                break;
            }
        }
        for(let i = pendingFields.length -1; i >= 0; i--) {
            pendingFields[i].addToScene(this._fieldsContainer,
                this._containerInteractable);
        }
        this._updateNavButtons();
    }

    _updateNavButtons() {
        if(this._firstItemIndex == 0) {
            this._previousButton.visible = false;
            this._containerInteractable.removeChild(this._previousInteractable);
        } else {
            this._previousButton.visible = true;
            this._containerInteractable.addChild(this._previousInteractable);
        }
        if(this._lastItemIndex + 1 == this._fields.length) {
            this._nextButton.visible = false;
            this._containerInteractable.removeChild(this._nextInteractable);
        } else {
            this._nextButton.visible = true;
            this._containerInteractable.addChild(this._nextInteractable);
        }
    }

    _removeCurrentFields() {
        for(let i = this._firstItemIndex; i <= this._lastItemIndex; i++) {
            let field = this._fields[i];
            field.deactivate();
            field.removeFromScene();
        }
    }

    _unfocusFields() {
        for(let i = this._firstItemIndex; i <= this._lastItemIndex; i++) {
            this._fields[i].deactivate();
        }
    }
}

export default DynamicFieldsPage;
