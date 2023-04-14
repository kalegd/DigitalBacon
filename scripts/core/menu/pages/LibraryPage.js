/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedIconsPage from '/scripts/core/menu/pages/PaginatedIconsPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const ASSETS = [{
        'text': 'Models',
        'icon': Textures.objectIcon,
        'page': MenuPages.ASSETS,
        'assetType': AssetTypes.MODEL,
    }, {
        'text': 'Images',
        'icon': Textures.imageIcon,
        'page': MenuPages.ASSETS,
        'assetType': AssetTypes.IMAGE,
    }, {
        'text': 'Shapes',
        'icon': Textures.shapesIcon,
        'page': MenuPages.ASSETS,
        'assetType': AssetTypes.SHAPE,
    }, {
        'text': 'Lights',
        'icon': Textures.lightbulbIcon,
        'page': MenuPages.ASSETS,
        'assetType': AssetTypes.LIGHT,
    }, {
//        'text': 'Audio',
//        'icon': Textures.audioIcon,
//        'page': MenuPages.AUDIOS,
//        'assetType': AssetTypes.MODEL,
//    }, {
//        'text': 'Video',
//        'icon': Textures.videoIcon,
//        'page': MenuPages.VIDEOS,
//        'assetType': AssetTypes.MODEL,
//    }, {
        'text': 'Materials',
        'icon': Textures.materialIcon,
        'page': MenuPages.MATERIALS,
    }, {
        'text': 'Textures',
        'icon': Textures.textureIcon,
        'page': MenuPages.TEXTURES,
    }
];

class LibraryPage extends PaginatedIconsPage {
    constructor(controller) {
        super(controller, true);
        this._items = Object.keys(ASSETS);
        this._addPageContent();
        this._createSearchButton();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Assets',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        this._addList();
    }

    _createSearchButton() {
        let searchButtonParent = new ThreeMeshUI.Block({
            height: 0.06,
            width: 0.06,
            backgroundColor: Colors.defaultMenuBackground,
            backgroundOpacity: 0,
        });
        let searchButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.searchIcon,
            'backgroundTextureScale': 0.8,
            'height': 0.04,
            'width': 0.04,
            'padding': 0.01,
        });
        searchButtonParent.set({ fontFamily: Fonts.defaultFamily, fontTexture: Fonts.defaultTexture });
        searchButtonParent.position.fromArray([-0.175, 0.12, -0.001]);
        searchButtonParent.add(searchButton);
        let interactable = new PointerInteractable(searchButton, () => {
            this._controller.pushPage(MenuPages.LIBRARY_SEARCH);
        });
        this._containerInteractable.addChild(interactable);
        this._object.add(searchButtonParent);
    }

    _getItemName(item) {
        return ASSETS[item].text;
    }

    _getItemIcon(item) {
        return ASSETS[item].icon;
    }

    _handleItemInteraction(item) {
        if(ASSETS[item].assetType) {
            let page = this._controller.getPage(ASSETS[item].page);
            page.setContent(ASSETS[item].assetType, ASSETS[item].text);
        }
        this._controller.pushPage(ASSETS[item].page);
    }

    _refreshItems() {
        return;
    }

}

export default LibraryPage;
