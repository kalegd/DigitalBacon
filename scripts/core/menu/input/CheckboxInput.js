/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.14;
const CHECKBOX_WIDTH = 0.04;
const CHECKBOX_HEIGHT = 0.04;

class CheckboxInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._onUpdate = params['onUpdate'];
        this._getFromSource = params['getFromSource'];
        let initialValue = params['initialValue'] || false;
        let title = params['title'] || 'Missing Field Name...';
        let titleWidth = params['titleWidth'] || TITLE_WIDTH;
        let contentDirection = params['swapOrder'] ? 'row-reverse' : 'row';
        this._suppressMenuFocusEvent = params['suppressMenuFocusEvent'];
        this._createInputs(initialValue, title, titleWidth, contentDirection);
    }

    _createInputs(initialValue, title, titleWidth, contentDirection) {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'contentDirection': contentDirection,
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
        });
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': title,
            'fontSize': FontSizes.body,
            'height': HEIGHT,
            'width': titleWidth,
            'margin': 0,
            'textAlign': contentDirection == 'row' ? 'left' : 'right',
        });
        this._selectBox = ThreeMeshUIHelper.createCheckboxBlock({
            'initialValue': initialValue,
            'height': CHECKBOX_HEIGHT,
            'width': CHECKBOX_WIDTH,
            'margin': 0,
        });
        this._object.add(titleBlock);
        this._object.add(this._selectBox);
        let interactable = new PointerInteractable(this._selectBox, () => {
            let value = this._selectBox.toggle();
            if(this._onUpdate) this._onUpdate(Boolean(value));
            PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
                'id': this._id,
                'targetOnlyMenu': this._suppressMenuFocusEvent,
            });
        });
        this._pointerInteractable.addChild(interactable);
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        //Required method
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        if(this._getFromSource() != this._selectBox.getIsChecked())
            this._selectBox.toggle();
    }
}

export default CheckboxInput;
