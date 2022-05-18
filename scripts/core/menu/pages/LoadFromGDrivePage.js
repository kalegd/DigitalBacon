/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import GoogleDrive from '/scripts/core/clients/GoogleDrive.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

class LoadFromGDrivePage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._instances = {};
        this._items = Object.keys(this._instances);
        this._addPageContent();
        this._filesLoaded = false;
        this._isLoadingSaving = false;
        this._addSubscriptions();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Load From Google Drive',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
        });
        this._container.add(this._titleBlock);

        this._loadingSavingBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Loading...',
            'fontSize': 0.025,
            'height': 0.04,
            'width': 0.4,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._container.add(this._loadingSavingBlock);
        this._addList();
    }

    _getItemName(item) {
        return this._instances[item]['name'];
    }

    _handleItemInteraction(item) {
        this._loadingSavingBlock.children[1].set({
            content: "Project Loading..."
        });
        this._updateLoadingSaving(false);
        PubSub.publish(this._id, PubSubTopics.PROJECT_LOADING, false);
        GoogleDrive.loadFile(this._instances[item]['id'],
            (jsZip) => { this._loadSuccessCallback(jsZip); },
            () => { this._loadErrorCallback(); });
    }

    _loadSuccessCallback(jsZip) {
        ProjectHandler.loadZip(jsZip, () => {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION,
                { text: 'Project Loaded', });
        }, () => {
            this._loadErrorCallback();
        });
    }

    _loadErrorCallback() {
        this._updateLoadingSaving(true);
        PubSub.publish(this._id, PubSubTopics.PROJECT_LOADING, true);
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Error Loading Project',
            sustainTime: 5,
        });
    }

    _refreshItems() {
        this._items = Object.keys(this._instances);
    }

    loadProjects() {
        let files = GoogleDrive.fetchFiles((files) => {
            if(!this._filesLoaded) {
                this._filesLoaded = true;
                if(!this._isLoadingSaving) {
                    this._container.remove(this._loadingSavingBlock);
                    this._container.add(this._optionsContainer);
                    this._containerInteractable.addChild(this._optionsInteractable);
                }
            }
            this._instances = files;
            this._refreshItems();
            this._updateItemsGUI();
        });
        if(files) {
            this._instances = files;
            if(!this._filesLoaded) {
                this._filesLoaded = true;
                if(!this._isLoadingSaving) {
                    this._container.remove(this._loadingSavingBlock);
                    this._container.add(this._optionsContainer);
                    this._containerInteractable.addChild(this._optionsInteractable);
                }
            }
        }
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (finished) => {
            this._loadingSavingBlock.children[1].set({
                content: "Project Loading..."
            });
            this._updateLoadingSaving(finished);
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_SAVING, (finished) => {
            this._loadingSavingBlock.children[1].set({
                content: "Project Saving..."
            });
            this._updateLoadingSaving(finished);
        });
    }

    _updateLoadingSaving(finished) {
        this._isLoadingSaving = !finished;
        if(finished) {
            if(!this._filesLoaded) {
                this._loadingSavingBlock.children[1].set({
                    content: "Loading..."
                });
                return;
            }
            this._container.remove(this._loadingSavingBlock);
            this._container.add(this._optionsContainer);
            this._containerInteractable.addChild(this._optionsInteractable);
            this._container.update(false, false, true);
        } else {
            this._container.remove(this._optionsContainer);
            this._container.add(this._loadingSavingBlock);
            this._containerInteractable.removeChild(this._optionsInteractable);
        }
    }

}

export default LoadFromGDrivePage;
