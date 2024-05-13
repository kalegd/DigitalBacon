/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import ReadyPlayerMe from '/scripts/core/clients/ReadyPlayerMe.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

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
        let titleBlock = new Text('Settings', Styles.title);
        this.add(titleBlock);

        let columnBlock = new Div({
            height: 0.2,
            width: 0.45,
        });
        for(let page of pages) {
            if(!global.isEditor && page.isEditorOnly) continue;
            let button = createWideButton(page.title);
            button.margin = 0.004;
            columnBlock.add(button);
            button.onClickAndTouch = () => {
                if(page.menuPage) {
                    this._controller.pushPage(page.menuPage);
                } else {
                    ReadyPlayerMe.selectAvatar();
                }

            };
        }
        this.add(columnBlock);
    }

}

export default SettingsPage;
