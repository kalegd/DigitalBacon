/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/scripts/DigitalBacon-UI.js';

const pages = [
    { "title": "Settings", "menuPage": MenuPages.SETTINGS },
    { "title": "Connect with Peers", "menuPage": MenuPages.PARTY },
    { "title": "Acknowledgements", "menuPage": MenuPages.ACKNOWLEDGEMENTS },
];

class HomePage extends MenuPage {
    constructor(controller) {
        super(controller, false);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Home', Styles.title);
        this.add(titleBlock);

        let columnBlock = new Div({
            height: 0.2,
            width: 0.45,
        });
        let supportsParty = global.authUrl && global.socketUrl;
        let acknowledgements = SettingsHandler.getAcknowledgements();
        for(let page of pages) {
            if(page['menuPage'] == MenuPages.PARTY && !supportsParty) continue;
            if(page['menuPage'] == MenuPages.ACKNOWLEDGEMENTS
                && acknowledgements.length == 0) continue;
            let button = createWideButton(page.title);
            button.margin = 0.004;
            columnBlock.add(button);
            button.onClickAndTouch =
                () => this._controller.pushPage(page.menuPage);
        }
        this.add(columnBlock);
    }
}

export default HomePage;
