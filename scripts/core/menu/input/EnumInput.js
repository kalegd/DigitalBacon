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
const FIELD_WIDTH = 0.17;
const FIELD_MARGIN = 0.01;
const FIELD_MAX_LENGTH = 13;

class EnumInput extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._getFromSource = params['getFromSource'];
        this._onUpdate = params['onUpdate'];
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        let options = params['options'] || [];
        this._createInputs(title, options);
    }

    _createInputs(title, options) {
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': HEIGHT,
            'width': WIDTH,
            'contentDirection': 'row',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
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
        this._optionSelection = ThreeMeshUIHelper.createButtonBlock({
            'text': stringWithMaxLength(this._lastValue, FIELD_MAX_LENGTH),
            'fontSize': FontSizes.body,
            'height': FIELD_HEIGHT,
            'width': FIELD_WIDTH,
            'margin': FIELD_MARGIN,
        });
        this._optionsContainer = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': FIELD_HEIGHT * options.length,
            'width': FIELD_WIDTH,
            'backgroundOpacity': 0,
            //'offset': 0,
        });
        this._optionsInteractable = new PointerInteractable(
            this._optionsContainer, true);
        for(let option of options) {
            let optionButton = ThreeMeshUIHelper.createButtonBlock({
                'text': option,
                'fontSize': FontSizes.body,
                'height': FIELD_HEIGHT,
                'width': FIELD_WIDTH,
                'margin': 0,
            });
            this._optionsContainer.add(optionButton);
            let interactable = new PointerInteractable(optionButton, true);
            interactable.addAction(() => { this._handleSelection(option); });
            this._optionsInteractable.addChild(interactable);
        }
        this._object.add(titleBlock);
        this._object.add(this._optionSelection);
        this._selectionInteractable = new PointerInteractable(
            this._optionSelection, true);
        this._selectionInteractable.addAction(() => {
            if(options.length == 0) return;
            this._optionSelection.add(this._optionsContainer);
            this._selectionInteractable.addChild(this._optionsInteractable);
        });
        this._pointerInteractable.addChild(this._selectionInteractable);
    }

    _handleSelection(option) {
        if(this._lastValue != option) {
            if(this._onUpdate) this._onUpdate(option);
            this._updateOption(option);
            PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
                'id': this._id,
                'targetOnlyMenu': true,
            });
        }
        this.deactivate();
    }

    _updateOption(option) {
        this._lastValue = option;
        option = stringWithMaxLength(option, FIELD_MAX_LENGTH);
        let textComponent = this._optionSelection.children[1];
        textComponent.set({ content: option });
    }

    getWidth() {
        return WIDTH;
    }

    getHeight() {
        return HEIGHT;
    }

    deactivate() {
        this._optionSelection.remove(this._optionsContainer);
        this._selectionInteractable.removeChild(this._optionsInteractable);
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let newValue = this._getFromSource();
        if(newValue != this._lastValue) this._updateOption(newValue);
    }
}

export default EnumInput;
