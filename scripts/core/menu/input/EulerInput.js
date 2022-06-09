/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { roundWithPrecision } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import ThreeMeshUI from 'three-mesh-ui';
import { MathUtils } from 'three';

const HEIGHT = 0.11;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.09
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.0025;
const FIELD_MAX_LENGTH = 13;

class EulerInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._onBlur = params['onBlur'];
        this._onUpdate = params['onUpdate'];
        this._euler = params['euler'];
        this._lastValue = this._euler.toArray();
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
            'initialText': toDegrees(this._euler.x),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._blur(0); },
            'onUpdate': () => { this._update(0); },
        });
        this._yField = new NumberField({
            'initialText': toDegrees(this._euler.y),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._blur(1); },
            'onUpdate': () => { this._update(1); },
        });
        this._zField = new NumberField({
            'initialText': toDegrees(this._euler.z),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
            'maxLength': FIELD_MAX_LENGTH,
            'onBlur': () => { this._blur(2); },
            'onUpdate': () => { this._update(2); },
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

    _update(index) {
        let newValue = [this.getX(), this.getY(), this.getZ()];
        if(!isNaN(newValue[index])) {
            newValue.forEach((v, i) => newValue[i] = MathUtils.degToRad(v));
            if(this._onUpdate) this._onUpdate(newValue);
        }
    }

    _blur(index) {
        let newValue = [this.getX(), this.getY(), this.getZ()];
        newValue.forEach((v, i) => newValue[i] = MathUtils.degToRad(v));
        if(this._onBlur) this._onBlur(this._lastValue, newValue);
        this._lastValue = newValue;
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
        this._xField.setContent(toDegrees(this._euler.x));
        this._yField.setContent(toDegrees(this._euler.y));
        this._zField.setContent(toDegrees(this._euler.z));
        this._lastValue = this._euler.toArray();
    }
}

export default EulerInput;

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

function toDegrees(radians) {
    return String(roundWithPrecision(MathUtils.radToDeg(radians), 5));
}
