/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import ReadyPlayerMe from '/scripts/core/clients/ReadyPlayerMe.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const pages = [
    { "title": "Backdrop", "menuPage": MenuPages.SKYBOX, isEditorOnly: true },
    { "title": "Visitor Settings", "menuPage": MenuPages.USER_SETTINGS },
    { "title": "Editor Settings", "menuPage": MenuPages.EDITOR_SETTINGS,
        isEditorOnly: true },
    { "title": "Update Avatar" },
    { "title": "Acknowledgements", "menuPage": MenuPages.EDIT_ACKNOWLEDGEMENTS,
        isEditorOnly: true },
];

class SettingsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Settings',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });
        for(let page of pages) {
            if(!global.isEditor && page.isEditorOnly) continue;
            let button = ThreeMeshUIHelper.createButtonBlock({
                'text': page.title,
                'fontSize': FontSizes.body,
                'height': 0.035,
                'width': 0.3,
                'margin': 0.002,
            });
            columnBlock.add(button);
            let interactable = new PointerInteractable(button, () => {
                if(page.menuPage) {
                    this._controller.pushPage(page.menuPage);
                } else {
                    ReadyPlayerMe.selectAvatar();
                }

            });
            this._containerInteractable.addChild(interactable);
        }
        this._container.add(columnBlock);
    }

}

export default SettingsPage;
