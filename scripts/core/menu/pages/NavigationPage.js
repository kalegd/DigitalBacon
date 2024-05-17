/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const pages = [
    { "title": "Hand Tools", "menuPage": MenuPages.HANDS },
    { "title": "Library", "menuPage": MenuPages.LIBRARY },
    { "title": "Settings", "menuPage": MenuPages.SETTINGS },
    { "title": "Project File", "menuPage": MenuPages.PROJECT },
    { "title": "Connect with Peers", "menuPage": MenuPages.PARTY },
];

class NavigationPage extends MenuPage {
    constructor(controller) {
        super(controller, false);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Menu', Styles.title);
        this.add(titleBlock);

        let columnBlock = new Div({
            height: 0.2,
            width: 0.45,
        });
        let supportsParty = global.authUrl && global.socketUrl;
        for(let page of pages) {
            if(global.deviceType != 'XR' && page['menuPage'] == MenuPages.HANDS)
                continue;
            if(page['menuPage'] == MenuPages.PARTY && !supportsParty) continue;
            let button = createWideButton(page.title);
            button.margin = 0.004;
            columnBlock.add(button);
            button.onClickAndTouch =
                () => this._controller.pushPage(page.menuPage);
        }
        this.add(columnBlock);
    }

}

export default NavigationPage;
