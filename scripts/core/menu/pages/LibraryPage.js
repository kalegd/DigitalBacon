/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import { Styles, Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import PaginatedIconsPage from '/scripts/core/menu/pages/PaginatedIconsPage.js';
import { Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const ASSETS = [{
    'text': 'Models',
    'icon': Textures.objectIcon,
    'assetType': AssetTypes.MODEL,
}, {
    'text': 'Images',
    'icon': Textures.imageIcon,
    'assetType': AssetTypes.IMAGE,
}, {
    'text': 'Shapes',
    'icon': Textures.shapesIcon,
    'assetType': AssetTypes.SHAPE,
}, {
    'text': 'Lights',
    'icon': Textures.lightbulbIcon,
    'assetType': AssetTypes.LIGHT,
}, {
    'text': 'Materials',
    'icon': Textures.materialIcon,
    'assetType': AssetTypes.MATERIAL,
}, {
    'text': 'Textures',
    'icon': Textures.textureIcon,
    'assetType': AssetTypes.TEXTURE,
}, {
    'text': 'Audio',
    'icon': Textures.audioIcon,
    'assetType': AssetTypes.AUDIO,
}, {
    'text': 'Video',
    'icon': Textures.videoIcon,
    'assetType': AssetTypes.VIDEO,
}, {
    'text': 'Components',
    'icon': Textures.componentIcon,
    'assetType': AssetTypes.COMPONENT,
}, {
    'text': 'Systems',
    'icon': Textures.systemIcon,
    'assetType': AssetTypes.SYSTEM,
}, {
    'text': 'Other Assets',
    'icon': Textures.ellipsisIcon,
    'assetType': AssetTypes.CUSTOM_ASSET,
}
];

class LibraryPage extends PaginatedIconsPage {
    constructor(controller) {
        super(controller, true);
        this._items = Object.keys(ASSETS);
        this._labelSizeOverride = 0.015;
        this._addPageContent();
        this._createSearchButton();
    }

    _addPageContent() {
        let titleBlock = new Text('Assets', Styles.title);
        this.add(titleBlock);

        this._addList();
    }

    _createSearchButton() {
        let searchButton = createSmallButton(Textures.searchIcon, 0.8);
        searchButton.bypassContentPositioning = true;
        searchButton.position.fromArray([-0.175, 0.12, 0.001]);
        searchButton.onClickAndTouch = () => {
            this._controller.pushPage(MenuPages.LIBRARY_SEARCH);
        };
        this.add(searchButton);
    }

    _getItemName(item) {
        return ASSETS[item].text;
    }

    _getItemIcon(item) {
        return ASSETS[item].icon;
    }

    _handleItemInteraction(item) {
        this._controller.pushPage(ASSETS[item].assetType + 'S');
    }

    _refreshItems() {
        return;
    }

}

export default LibraryPage;
