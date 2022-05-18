/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import { Colors, Fonts, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import ThreeMeshUI from 'three-mesh-ui';

const FONT_FAMILY = Fonts.defaultFamily;
const FONT_TEXTURE = Fonts.defaultTexture;
const UI_BACKGROUND_COLOR = Colors.defaultMenuBackground;
const UI_BACKGROUND_OPACITY = 0.5;

class MenuPage extends PointerInteractableEntity {
    constructor(controller, hasSideBar, hasBackButton) {
        super();
        this._controller = controller;
        this._createPage();
        this._createCloseButton();
        if(hasSideBar) {
            this._createSideBarButton();
        } else if(hasBackButton) {
            this._createBackButton();
        }
    }

    _createSideBarButton() {
        let sidebarButtonParent = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.06,
            backgroundColor: UI_BACKGROUND_COLOR,
            backgroundOpacity: 0,
        });
        let sidebarButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.hamburgerIcon,
            'height': 0.04,
            'width': 0.04,
        });
        sidebarButtonParent.set({ fontFamily: FONT_FAMILY, fontTexture: FONT_TEXTURE });
        sidebarButtonParent.position.fromArray([-.225, 0.15, -0.001]);
        sidebarButtonParent.add(sidebarButton);
        let interactable = new PointerInteractable(sidebarButton, () => {
            this._controller.setPage(MenuPages.NAVIGATION);
        });
        this._pointerInteractable.addChild(interactable);
        this._object.add(sidebarButtonParent);
    }

    _createBackButton() {
        let backButtonParent = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.06,
            backgroundColor: UI_BACKGROUND_COLOR,
            backgroundOpacity: 0,
        });
        let backButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '<',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
        });
        backButtonParent.set({ fontFamily: FONT_FAMILY, fontTexture: FONT_TEXTURE });
        backButtonParent.position.fromArray([-.225, 0.15, -0.001]);
        backButtonParent.add(backButton);
        let interactable = new PointerInteractable(backButton, () => {
            this.back();
        });
        this._pointerInteractable.addChild(interactable);
        this._object.add(backButtonParent);
    }

    _createCloseButton() {
        let closeButtonParent = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.06,
            backgroundColor: UI_BACKGROUND_COLOR,
            backgroundOpacity: 0,
        });
        let closeButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "X",
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
        });
        closeButtonParent.set({ fontFamily: FONT_FAMILY, fontTexture: FONT_TEXTURE });
        closeButtonParent.position.fromArray([.225, 0.15, -0.001]);
        closeButtonParent.add(closeButton);
        let interactable = new PointerInteractable(closeButton, () => {
            this._controller.closeMenu();
        });
        this._pointerInteractable.addChild(interactable);
        this._object.add(closeButtonParent);
    }

    _createPage() {
        this._container = new ThreeMeshUI.Block({
            height: 0.3,
            width: 0.45,
            borderWidth: 0,
            offset: 0,
            backgroundOpacity: 0,
        });
        let borderedBlock = new ThreeMeshUI.Block({
            height: 0.3,
            width: 0.45,
            backgroundColor: UI_BACKGROUND_COLOR,
            backgroundOpacity: UI_BACKGROUND_OPACITY,
            borderWidth: 0.001,
            borderColor: Colors.white,
            borderOpacity: 0.75,
        });
        this._container.set({ fontFamily: FONT_FAMILY, fontTexture: FONT_TEXTURE });
        this._containerInteractable = new PointerInteractable(
            this._container.children[0], null, false);
        this._pointerInteractable.addChild(this._containerInteractable);
        borderedBlock.add(this._container);
        this._object.add(borderedBlock);
    }

    //Can be overwritten to add functionality to back button being pressed
    back() {
        this._controller.popPage();
    }

}

export default MenuPage;
