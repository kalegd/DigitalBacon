/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import PaginatedImagesPage from '/scripts/core/menu/pages/PaginatedImagesPage.js';
import ThreeMeshUI from 'three-mesh-ui';
import { TextureLoader } from 'three';

class SketchfabSearchPage extends PaginatedImagesPage {
    constructor(controller) {
        super(controller, true);
        this._items = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._textField = new TextField({
            'height': 0.04,
            'width': 0.4,
            'text': 'Search',
            'fontSize': FontSizes.header,
            'onBlur': () => { this._searchUpdated(); },
        });
        this._textField.addToScene(this._container,this._containerInteractable);
        this._loadingBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Loading...',
            'fontSize': 0.025,
            'height': 0.04,
            'width': 0.4,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });

        this._addList();
    }

    _searchUpdated() {
        let texturesToDispose = [];
        for(let item of this._items) {
            item.isDeleted = true;
            if(item.previewTexture) item.previewTexture.dispose();
        }
        this._page = 0;
        this._items = [];
        this._updateItemsGUI();
        if(this._textField.content.length == 0) {
            this._textField.reset();
            return;
        }
        this._container.remove(this._optionsContainer);
        this._container.add(this._loadingBlock);
        let number = Math.random();
        this._idempotentKey = number;
        Sketchfab.search(this._textField.content,
            (response) => { this._handleSearchResponse(response, number) },
            () => { this._handleSearchError() });
    }

    _handleSearchResponse(response, number) {
        if(this._idempotentKey != number) return;
        this._container.remove(this._loadingBlock);
        this._container.add(this._optionsContainer);
        for(let result of response.results) {
            this._items.push(result);
        }
        this._canFetchMore = response.next;
        this._updateItemsGUI();
    }

    _handleSearchError() {
        this._container.remove(this._loadingBlock);
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
        this._container.remove(this._optionsContainer);
        this._container.add(this._loadingBlock);
        let number = Math.random();
        this._idempotentKey = number;
        Sketchfab.fetch(this._canFetchMore,
            (response) => { this._handleSearchResponse(response, number) },
            () => { this._handleFetchMoreError() });
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
