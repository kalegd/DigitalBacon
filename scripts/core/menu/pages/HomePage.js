/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

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
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Home',
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
        let authoredAssets = this._getAuthoredAssets();
        for(let page of pages) {
            if(page['menuPage'] == MenuPages.PARTY && !supportsParty) continue;
            if(page['menuPage'] == MenuPages.ACKNOWLEDGEMENTS
                && authoredAssets.length == 0) continue;
            let button = ThreeMeshUIHelper.createButtonBlock({
                'text': page.title,
                'fontSize': FontSizes.body,
                'height': 0.035,
                'width': 0.3,
                'margin': 0.002,
            });
            columnBlock.add(button);
            let interactable = new PointerInteractable(button, () => {
                if(page.menuPage == MenuPages.ACKNOWLEDGEMENTS) {
                    let page = this._controller.getPage(
                        MenuPages.ACKNOWLEDGEMENTS);
                    page.setAssets(authoredAssets);
                }
                this._controller.pushPage(page.menuPage);
            });
            this._containerInteractable.addChild(interactable);
        }
        this._container.add(columnBlock);
    }

    _getAuthoredAssets() {
        let authoredAssets = [];
        for(let assetId in LibraryHandler.library) {
            let asset = LibraryHandler.library[assetId];
            if(asset['Type'] == AssetTypes.MODEL && asset['Author']) {
                authoredAssets.push(asset);
            }
        }
        return authoredAssets;
    }
}

export default HomePage;
