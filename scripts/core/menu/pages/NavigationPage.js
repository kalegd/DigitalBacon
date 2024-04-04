/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

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
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Menu',
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
        let supportsParty = global.authUrl && global.socketUrl;
        for(let page of pages) {
            if(global.deviceType != 'XR' && page['menuPage'] == MenuPages.HANDS)
                continue;
            if(page['menuPage'] == MenuPages.PARTY && !supportsParty) continue;
            let button = ThreeMeshUIHelper.createButtonBlock({
                'text': page.title,
                'fontSize': FontSizes.body,
                'height': 0.035,
                'width': 0.3,
                'margin': 0.002,
            });
            columnBlock.add(button);
            let interactable = new PointerInteractable(button);
            interactable.addEventListener('click', () => {
                this._controller.pushPage(page.menuPage);
            });
            this._containerInteractable.addChild(interactable);
        }
        this._container.add(columnBlock);
    }

}

export default NavigationPage;
