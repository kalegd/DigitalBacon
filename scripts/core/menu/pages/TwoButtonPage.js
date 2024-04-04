/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class TwoButtonPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': 0.08,
            'width': 0.4,
        });
        this._container.add(this._titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });
        this._button1 = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': 0.04,
            'width': 0.25,
            'margin': 0.002,
        });
        this._button2 = ThreeMeshUIHelper.createButtonBlock({
            'text': ' ',
            'fontSize': FontSizes.body,
            'height': 0.04,
            'width': 0.25,
            'margin': 0.002,
        });
        let interactable1 = new PointerInteractable(this._button1);
        interactable1.addEventListener('click', () => {
            if(this._action1) this._action1();
        });
        let interactable2 = new PointerInteractable(this._button2);
        interactable2.addEventListener('click', () => {
            if(this._action2) this._action2();
        });
        columnBlock.add(this._button1);
        columnBlock.add(this._button2);
        this._container.add(columnBlock);
        this._containerInteractable.addChild(interactable1);
        this._containerInteractable.addChild(interactable2);
    }

    setContent(title, button1Text, button2Text, action1, action2) {
        this._titleBlock.children[1].set({ content: title });
        this._button1.children[1].set({ content: button1Text });
        this._button2.children[1].set({ content: button2Text });
        this._action1 = action1;
        this._action2 = action2;
    }
}

export default TwoButtonPage;
