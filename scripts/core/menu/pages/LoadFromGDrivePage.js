/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import GoogleDrive from '/scripts/core/clients/GoogleDrive.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import PaginatedButtonsPage from '/scripts/core/menu/pages/PaginatedButtonsPage.js';
import { Text } from '/scripts/DigitalBacon-UI.js';

class LoadFromGDrivePage extends PaginatedButtonsPage {
    constructor(controller) {
        super(controller, true);
        this._instances = {};
        this._items = Object.keys(this._instances);
        this._addPageContent();
        this._filesLoaded = false;
        this._isLoadingSaving = false;
        this._addSubscriptions();
    }

    _addPageContent() {
        let titleBlock = new Text('Load From Google Drive', Styles.title);
        this.add(titleBlock);

        this._loadingSavingBlock = new Text('Loading...',
            Styles.bodyText, { height: 0.2 });
        this.add(this._loadingSavingBlock);
        this._addList();
    }

    _getItemName(item) {
        return this._instances[item]['name'];
    }

    _handleItemInteraction(item) {
        this._loadingSavingBlock.text = 'Project Loading...';
        this._updateLoadingSaving(false);
        GoogleDrive.loadFile(this._instances[item]['id'],
            (jsZip) => { this._loadSuccessCallback(jsZip); },
            () => { this._loadErrorCallback(); });
    }

    _loadSuccessCallback(jsZip) {
        ProjectHandler.loadZip(jsZip, () => {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION,
                { text: 'Project Loaded', });
            if(PartyHandler.isPartyActive() && PartyHandler.isHost()) {
                PartyHandler.sendProject();
            }
        }, () => {
            this._loadErrorCallback();
        });
    }

    _loadErrorCallback() {
        this._updateLoadingSaving(true);
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
                    this.remove(this._loadingSavingBlock);
                    this.add(this._optionsContainer);
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
                    this.remove(this._loadingSavingBlock);
                    this.add(this._optionsContainer);
                }
            }
        }
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (finished) => {
            this._loadingSavingBlock.text = 'Project Loading...';
            this._updateLoadingSaving(finished);
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_SAVING, (finished) => {
            this._loadingSavingBlock.text = 'Project Saving...';
            this._updateLoadingSaving(finished);
        });
    }

    _updateLoadingSaving(finished) {
        this._isLoadingSaving = !finished;
        if(finished) {
            if(!this._filesLoaded) {
                this._loadingSavingBlock.text = 'Loading...';
                return;
            }
            this.remove(this._loadingSavingBlock);
            this.add(this._optionsContainer);
        } else {
            this.remove(this._optionsContainer);
            this.add(this._loadingSavingBlock);
        }
    }

}

export default LoadFromGDrivePage;
