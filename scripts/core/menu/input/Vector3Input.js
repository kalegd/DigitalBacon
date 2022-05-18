/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.11;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.09;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.0025;
const FIELD_MAX_LENGTH = 13;

class Vector3Input extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._vector3 = params['vector3'];
        this._lastValues = this._vector3.toArray();
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
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
            'margin': 0,
            'offset': 0,
        });
        let columnBlock = new ThreeMeshUI.Block({
            'height': HEIGHT,
            'width': WIDTH - TITLE_WIDTH,
            'contentDirection': 'column',
            'justifyContent': 'center',
            'alignItems': 'end',
            'backgroundOpacity': 0,
            'margin': 0,
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
        this._xField = new NumberField({
            'initialText': String(this._vector3.x),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._onBlur(0); },
            'onUpdate': () => { this._onUpdate(0); },
        });
        this._yField = new NumberField({
            'initialText': String(this._vector3.y),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._onBlur(1); },
            'onUpdate': () => { this._onUpdate(1); },
        });
        this._zField = new NumberField({
            'initialText': String(this._vector3.z),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._onBlur(2); },
            'onUpdate': () => { this._onUpdate(2); },
        });
        let xRow = createLabelRow("X:");
        let yRow = createLabelRow("Y:");
        let zRow = createLabelRow("Z:");
        this._xField.addToScene(xRow, this._pointerInteractable);
        this._yField.addToScene(yRow, this._pointerInteractable);
        this._zField.addToScene(zRow, this._pointerInteractable);
        this._object.add(titleBlock);
        this._object.add(columnBlock);
        columnBlock.add(xRow);
        columnBlock.add(yRow);
        columnBlock.add(zRow);
    }

    _onUpdate(index) {
        if(index == 0) {
            let number = this.getX();
            if(!isNaN(number)) {
                this._vector3.setX(number);
            }
        } else if(index == 1) {
            let number = this.getY();
            if(!isNaN(number)) {
                this._vector3.setY(number);
            }
        } else if(index == 2) {
            let number = this.getZ();
            if(!isNaN(number)) {
                this._vector3.setZ(number);
            }
        }
    }

    _onBlur(index) {
        this._onUpdate(index);
        let preValue = this._lastValues[index];
        let postValue = this._vector3.getComponent(index);
        if(preValue != postValue) {
            UndoRedoHandler.addAction(() => {
                this._vector3.setComponent(index, preValue);
                this.updateFromSource();
            }, () => {
                this._vector3.setComponent(index, postValue);
                this.updateFromSource();
            });
            this._lastValues[index] = this._vector3.getComponent(index);
        }
    }

    getX() {
        return Number.parseFloat(this._xField.content);
    }

    getY() {
        return Number.parseFloat(this._yField.content);
    }

    getZ() {
        return Number.parseFloat(this._zField.content);
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        this._xField.deactivate();
        this._yField.deactivate();
        this._zField.deactivate();
    }

    reset() {
        this._xField.reset();
        this._yField.reset();
        this._zField.reset();
    }

    updateFromSource() {
        this._xField.setContent(String(this._vector3.x));
        this._yField.setContent(String(this._vector3.y));
        this._zField.setContent(String(this._vector3.z));
        this._lastValues = this._vector3.toArray();
    }
}

export default Vector3Input;

////////////////////////////

function createLabelRow(label) {
    let row = new ThreeMeshUI.Block({
        'height': FIELD_HEIGHT,
        'width': WIDTH - TITLE_WIDTH,
        'contentDirection': 'row',
        'justifyContent': 'start',
        'backgroundOpacity': 0,
        'margin': FIELD_MARGIN,
        'offset': 0,
    });
    let labelBlock = ThreeMeshUIHelper.createTextBlock({
        'text': label,
        'fontSize': FontSizes.body,
        'height': FIELD_HEIGHT,
        'width': WIDTH - TITLE_WIDTH - FIELD_WIDTH,
        'margin': 0,
    });
    row.add(labelBlock);
    return row;
}

