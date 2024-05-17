/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { FontSizes, Styles, Textures } from '/scripts/core/helpers/constants.js';
import { createTextInput } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import PaginatedImagesPage from '/scripts/core/menu/pages/PaginatedImagesPage.js';
import { Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import { TextureLoader } from 'three';

class SketchfabSearchPage extends PaginatedImagesPage {
    constructor(controller) {
        super(controller, true);
        this._items = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._searchInput = createTextInput({
            borderRadius: 0.02,
            fontSize: FontSizes.body,
            height: 0.04,
            marginBottom: 0.004,
            marginTop: 0.01,
            width: 0.375,
        });
        this._searchInput.onBlur = () => this._searchUpdated();
        this._searchInput.onEnter = () => this._searchInput.blur();
        this._searchInput.onFocus = () => { global.keyboardLock = true; };
        this.add(this._searchInput);
        this._loadingBlock = new Text('Loading...', Styles.bodyText,
            { height: 0.2 });

        this._addList();
    }

    _searchUpdated() {
        global.keyboardLock = false;
        for(let item of this._items) {
            item.isDeleted = true;
            if(item.previewTexture) item.previewTexture.dispose();
        }
        this._page = 0;
        this._items = [];
        this._updateItemsGUI();
        if(this._searchInput.value.length == 0) return;
        this.remove(this._optionsContainer);
        this.add(this._loadingBlock);
        let number = Math.random();
        this._idempotentKey = number;
        Sketchfab.search(this._searchInput.value,
            (response) => { this._handleSearchResponse(response, number); },
            () => { this._handleSearchError(); });
    }

    _handleSearchResponse(response, number) {
        if(this._idempotentKey != number) return;
        this.remove(this._loadingBlock);
        this.add(this._optionsContainer);
        for(let result of response.results) {
            this._items.push(result);
        }
        this._canFetchMore = response.next;
        this._updateItemsGUI();
    }

    _handleSearchError() {
        this.remove(this._loadingBlock);
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'An unexpected error occurred, please try again later',
        });
    }

    _handleFetchMoreError() {
        this._page--;
        this._updateItemsGUI();
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'An unexpected error occurred, please try again later',
        });
    }

    _fetchNextItems() {
        this.remove(this._optionsContainer);
        this.add(this._loadingBlock);
        let number = Math.random();
        this._idempotentKey = number;
        Sketchfab.fetch(this._canFetchMore,
            (response) => { this._handleSearchResponse(response, number); },
            () => { this._handleFetchMoreError(); });
    }

    _getItemImage(item) {
        if(item.previewTexture) {
            return item.previewTexture;
        } else if(!item.isLoadingTexture) {
            let image = this._getSmallestImage(item.thumbnails.images);
            item.previewUrl = image.url;
            item.isLoadingTexture = true;
            new TextureLoader().load(item.previewUrl, (texture) => {
                if(item.isDeleted) {
                    texture.dispose();
                } else {
                    item.previewTexture = texture;
                    this._updateItemsGUI();
                }
            });
        }
        return Textures.ellipsisIcon;
    }

    //With the caveat that it's at least 256px wide
    _getSmallestImage(images) {
        let smallestImage = null;
        for(let image of images) {
            if(image.width < 256) continue;
            if(smallestImage == null || image.size < smallestImage.size) {
                smallestImage = image;
            }
        }
        return smallestImage;
    }

    _handleItemInteraction(item) {
        let page = this._controller.getPage(MenuPages.SKETCHFAB_ASSET);
        page.setContent(item);
        this._controller.pushPage(MenuPages.SKETCHFAB_ASSET);
    }

    _refreshItems() {
        return;
    }

}

export default SketchfabSearchPage;
