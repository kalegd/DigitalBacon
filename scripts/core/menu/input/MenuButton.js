/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUI from 'three-mesh-ui';

const HEIGHT = 0.05;
const WIDTH = 0.31;
const TITLE_WIDTH = 0.13;
const FIELD_HEIGHT = 0.03;
const FIELD_WIDTH = 0.3;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 13;

class ButtonInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._onClick = params['onClick'];
        let title = params['title'] || 'Missing Field Name...';
        this._createInputs(title);
    }

    _createInputs(title) {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'backgroundOpacity': 0,
            'offset': 0,
        });
        let button = ThreeMeshUIHelper.createButtonBlock({
            'text': title,
            'fontSize': FontSizes.body,
            'height': HEIGHT,
            'width': TITLE_WIDTH,
            'margin': FIELD_MARGIN,
        });
        this._object.add(button);
        let interactable = new PointerInteractable(button, true);
        interactable.addAction(() => { if(this._onClick) this._onClick(); });
        this._pointerInteractable.addChild(interactable);
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
    }

    updateFromSource() {
    }
}

export default ButtonInput;
