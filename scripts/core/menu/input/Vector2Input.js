/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.085;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.09;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.0025;
const FIELD_MAX_LENGTH = 13;

class Vector2Input extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._onBlur = params['onBlur'];
        this._onUpdate = params['onUpdate'];
        this._getFromSource = params['getFromSource'];
        this._lastValue = params['initialValue'] || [0, 0];
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
            'initialText': String(this._lastValue[0]),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._blur(0); },
            'onUpdate': () => { this._update(0); },
        });
        this._yField = new NumberField({
            'initialText': String(this._lastValue[1]),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._blur(1); },
            'onUpdate': () => { this._update(1); },
        });
        let xRow = createLabelRow("X:");
        let yRow = createLabelRow("Y:");
        this._xField.addToScene(xRow, this._pointerInteractable);
        this._yField.addToScene(yRow, this._pointerInteractable);
        this._object.add(titleBlock);
        this._object.add(columnBlock);
        columnBlock.add(xRow);
        columnBlock.add(yRow);
    }

    _update(index) {
        let newValue = [this.getX(), this.getY()];
        if(!isNaN(newValue[index])) {
            if(this._onUpdate) this._onUpdate(newValue);
        }
    }

    _blur(index) {
        let newValue = [this.getX(), this.getY()];
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
    }

    getX() {
        return Number.parseFloat(this._xField.content);
    }

    getY() {
        return Number.parseFloat(this._yField.content);
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
    }

    reset() {
        this._xField.reset();
        this._yField.reset();
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let value = this._getFromSource();
        if(value[0] != this._lastValue[0] || value[1] != this._lastValue[1]) {
            this._lastValue = value;
            this._xField.setContent(String(value[0]));
            this._yField.setContent(String(value[1]));
        }
    }
}

export default Vector2Input;

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

