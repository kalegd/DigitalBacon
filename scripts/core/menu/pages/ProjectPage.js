/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import UserController from '/scripts/core/assets/UserController.js';
import AmbientLight from '/scripts/core/assets/primitives/AmbientLight.js';
import GoogleDrive from '/scripts/core/clients/GoogleDrive.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import PaginatedButtonsPage from '/scripts/core/menu/pages/PaginatedButtonsPage.js';
import { DelayedClickHandler } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import { Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

/* global saveAs, JSZip */

const HOSTING_ORIGIN = 'https://mydigitalbacon.com';
const HOSTING_URL = HOSTING_ORIGIN + '/login?referrer=digitalbacon';
const PREVIEW_ORIGIN = 'https://digitalbacon.io';
const PREVIEW_URL = PREVIEW_ORIGIN + '/preview';
const OPTIONS = {
    'New Project': '_newProject',
    'Host Online': '_hostOnMyDigitalBacon',
    'Preview Live': '_previewLive',
    'Save to Device': '_localSave',
    'Load from Device': '_localLoad',
    'Save to Google Drive': '_googleDriveSave',
    'Load from Google Drive': '_googleDriveLoad',
    'Sign out of Google Drive': '_googleDriveSignout',
};

class ProjectPage extends PaginatedButtonsPage {
    constructor(controller) {
        super(controller, true);
        this._items = Object.keys(OPTIONS).slice(0, -1);
        this._addPageContent();
        this._addSubscriptions();
    }

    _addPageContent() {
        let titleBlock = new Text('Project File', Styles.title);
        this.add(titleBlock);

        this._loadingSavingBlock = new Text('Project Loading...',
            Styles.bodyText, { height: 0.2 });

        this._addList();
    }

    _getItemName(item) {
        return item;
    }

    _handleItemInteraction(item) {
        this[OPTIONS[item]]();
    }

    _refreshItems() {
        let isSignedIn = GoogleDrive.isSignedIn();
        this._items = Object.keys(OPTIONS).filter((v, i) => {
            if((this._isHosting && i == 1) || (!isSignedIn && i == 7)
                    || (this._isLoadingPreview && i == 2))
                return false;
            return true;
        });
    }

    _newProject() {
        if(PartyHandler.isPartyActive() && !PartyHandler.isHost()) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Only Host Can Load Projects',
            });
            return;
        }
        let page = this._controller.getPage(MenuPages.TWO_BUTTON);
        page.setContent(
            "You will lose any unsaved progress when starting a new project",
            "Confirm New Project",
            "Cancel",
            () => { this._newProjectConfirm(); },
            () => { this._controller.popPage(); });
        this._controller.pushPage(MenuPages.TWO_BUTTON);
    }

    _localSave() {
        this._updateSaving(false);
        PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, false);
        let jsZip = ProjectHandler.exportProject();
        jsZip.generateAsync({type:"blob"}).then((blob) => {
            this._updateSaving(true);
            PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, true);
            saveAs(blob, "Digital Bacon Project.zip");
        }, (err) => {
            console.error(err);
            this._updateSaving(true);
            PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, true);
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Error Saving Project',
            });
        });
    }

    _localLoad() {
        if(PartyHandler.isPartyActive() && !PartyHandler.isHost()) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Only Host Can Load Projects',
            });
            return;
        }
        UploadHandler.triggerProjectFileUpload((file) => {
            this._handleLocalFile(file);
        });
    }

    _googleDriveSave() {
        if(GoogleDrive.isSignedIn()) {
            if(GoogleDrive.hasActiveFile()) {
                let page = this._controller.getPage(MenuPages.TWO_BUTTON);
                let filename = GoogleDrive.getCurrentFileName();
                page.setContent(
                    "Would you like to overwrite " + filename
                        + " or save the project as a new one?",
                    "Overwrite existing project",
                    "Save as new",
                    () => {
                        this._controller.popPage();
                        this._googleDriveOverwrite();
                    },
                    () => {
                        this._controller.popPage();
                        this._googleDriveSaveAs();
                    });
                this._controller.pushPage(MenuPages.TWO_BUTTON);
            } else {
                this._googleDriveSaveAs();
            }
        } else {
            this._googleDriveSignin(() => this._googleDriveSave());
        }
    }

    _googleDriveOverwrite() {
        this._updateSaving(false);
        PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, false);
        GoogleDrive.save(
            ProjectHandler.exportProject(),
            () => { this._saveSuccessCallback(); },
            () => { this._saveErrorCallback(); });
    }

    _googleDriveSaveAs() {
        let inputPage = this._controller.getPage(MenuPages.TEXT_INPUT);
        inputPage.setContent("Save Project As", "Filename", "Save",
            (projectName) => {
                if(!projectName || projectName.length == 0) {
                    PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                        text: 'Please add a filename',
                    });
                    return;
                }
                this._updateSaving(false);
                PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING,false);
                GoogleDrive.saveAs(
                    projectName,
                    ProjectHandler.exportProject(),
                    () => { this._saveSuccessCallback(); },
                    () => { this._saveErrorCallback(); });
                this._controller.back();
            }
        );
        this._controller.pushPage(MenuPages.TEXT_INPUT);
    }

    _googleDriveLoad() {
        if(PartyHandler.isPartyActive() && !PartyHandler.isHost()) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Only Host Can Load Projects',
            });
            return;
        } else if(GoogleDrive.isSignedIn()) {
            let instancePage = this._controller.getPage(
                MenuPages.LOAD_GDRIVE);
            instancePage.loadProjects();
            this._controller.pushPage(MenuPages.LOAD_GDRIVE);
        } else {
            this._googleDriveSignin(() => this._googleDriveLoad());
        }
    }

    _googleDriveSignin(callback) {
        this._googleSigninCallback = callback;
        if(global.deviceType == 'XR') {
            SessionHandler.exitXRSession();
            GoogleDrive.handleAuthButton(
                () => { this._handleGoogleAuthResponse(); });
        } else {
            DelayedClickHandler.trigger(() => {
                try {
                    GoogleDrive.handleAuthButton(
                        () => { this._handleGoogleAuthResponse(); });
                } catch(error) {
                    PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                        text: 'Google could not be reached. Please check your '
                            + 'internet connection and then try refreshing the '
                            + 'page',
                    });
                }
            });
        }
    }

    _handleGoogleAuthResponse() {
        this._refreshItems();
        this._updateItemsGUI();
        if(this._googleSigninCallback) this._googleSigninCallback();
    }

    _googleDriveSignout() {
        if(GoogleDrive.isSignedIn()) {
            GoogleDrive.handleSignoutButton();
        }
        this._page = 0;
        this._refreshItems();
        this._updateItemsGUI();
    }

    _hostOnMyDigitalBacon() {
        this._stopHostingAttempt();
        this._isHosting = true;
        this._refreshItems();
        this._updateItemsGUI();
        DelayedClickHandler.trigger(() => {
            this._hostingTab = window.open(HOSTING_URL, '_blank');
            if(!this._hostingTab) {
                PubSub.publish(this._id,PubSubTopics.MENU_NOTIFICATION,{
                    text: 'Please check your popup blocker settings',
                });
                return;
            }
        });
        let jsZip = ProjectHandler.exportProject();
        jsZip.generateAsync({type:"blob"}).then((blob) => {
            let reader = new FileReader();
            reader.onloadend = () => {
                this._hostingBlob = reader.result;
                this._hostingTab.focus();
                this._hostingIntervalId = setInterval(() => {
                    this._hostingTab.postMessage('HOST_PROJECT',HOSTING_ORIGIN);
                }, 1000);
            };
            reader.readAsDataURL(blob);
        });
    }

    _previewLive() {
        this._stopPreviewAttempt();
        this._isLoadingPreview = true;
        this._refreshItems();
        this._updateItemsGUI();
        let jsZip = ProjectHandler.exportProject();
        jsZip.generateAsync({type:"blob"}).then((blob) => {
            let reader = new FileReader();
            reader.onloadend = () => {
                this._previewBlob = reader.result;
                this._previewTab = window.open(PREVIEW_URL, '_blank');
                if(!this._previewTab) {
                    this._stopPreviewAttempt();
                    PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                        text: 'Please check your popup blocker settings',
                    });
                    return;
                }
                if(global.deviceType == 'XR') SessionHandler.exitXRSession();
                this._previewTab.focus();
                this._previewIntervalCount = 0;
                this._previewIntervalId = setInterval(() => {
                    this._previewTab.postMessage({ topic: 'PREVIEW' },
                        PREVIEW_ORIGIN);
                    this._previewIntervalCount++;
                    if(this._previewIntervalCount > 10)
                        this._stopPreviewAttempt();
                }, 1000);
            };
            reader.readAsDataURL(blob);
        });
    }

    _stopHostingAttempt() {
        if(this._hostingIntervalId) {
            clearInterval(this._hostingIntervalId);
            this._hostingIntervalId = null;
        }
        if(this._hostingTab) {
            this._hostingTab.close();
            this._hostingTab = null;
        }
        this._hostingBlob = null;
        this._isHosting = false;
        this._refreshItems();
        this._updateItemsGUI();
    }

    _stopPreviewAttempt() {
        if(this._previewIntervalId) {
            clearInterval(this._previewIntervalId);
            this._previewIntervalId = null;
        }
        if(this._previewTab) {
            this._previewTab.close();
            this._previewTab = null;
        }
        this._previewBlob = null;
        this._isLoadingPreview = false;
        this._refreshItems();
        this._updateItemsGUI();
    }

    _handleLocalFile(file) {
        this._updateLoading(false);
        JSZip.loadAsync(file).then((jsZip) => {
            ProjectHandler.loadZip(jsZip, () => {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION,
                    { text: 'Project Loaded', });
                if(PartyHandler.isPartyActive() && PartyHandler.isHost()) {
                    PartyHandler.sendProject();
                }
            }, () => {
                this._loadErrorCallback();
            });
        });
    }

    _newProjectConfirm() {
        if(PartyHandler.isPartyActive() && !PartyHandler.isHost()) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Only Host Can Load Projects',
            });
            return;
        }
        ProjectHandler.reset();
        UserController.position = [0, 0, 0];
        let ambientLight = new AmbientLight({
            'visualEdit': false,
        });
        ProjectHandler.addAsset(ambientLight, false, true);
        GoogleDrive.clearActiveFile();
        if(PartyHandler.isPartyActive() && PartyHandler.isHost()) {
            PartyHandler.sendProject();
        }
        this._controller.popPage();
    }

    _loadErrorCallback() {
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Error Loading Project',
            sustainTime: 5,
        });
    }

    _saveSuccessCallback() {
        this._updateSaving(true);
        PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, true);
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Project Saved',
        });
    }

    _saveErrorCallback() {
        this._updateSaving(true);
        PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, true);
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Error Saving Project',
        });
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING,
            (finished) => { this._updateLoading(finished); });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_SAVING,
            (finished) => { this._updateSaving(finished); });
        window.addEventListener('message', (event) => {
            if(event.data == 'READY_FOR_PREVIEW_PROJECT') {
                if(event.origin != PREVIEW_ORIGIN) return;
                clearInterval(this._previewIntervalId);
                if(!this._previewBlob || !this._previewTab) return;
                this._previewTab.postMessage({
                    topic: 'PREVIEW_PROJECT',
                    blob: this._previewBlob,
                }, PREVIEW_ORIGIN);
                this._isLoadingPreview = false;
                this._refreshItems();
                this._updateItemsGUI();
            } else if(event.data == 'HOST_PROJECT') {
                if(event.origin != HOSTING_ORIGIN) return;
                clearInterval(this._hostingIntervalId);
                this._isHosting = false;
                this._refreshItems();
                this._updateItemsGUI();
                if(!this._hostingBlob || !this._hostingTab) return;
                this._hostingTab.postMessage({
                    topic: 'HOST_PROJECT',
                    blob: this._hostingBlob,
                }, HOSTING_ORIGIN);
            }
        });
    }

    _updateLoading(finished) {
        this._loadingSavingBlock.text = 'Project Loading...';
        this._updateLoadingSaving(finished);
    }

    _updateSaving(finished) {
        this._loadingSavingBlock.text = 'Project Saving...';
        this._updateLoadingSaving(finished);
    }

    _updateLoadingSaving(finished) {
        if(finished) {
            this.remove(this._loadingSavingBlock);
            this.add(this._optionsContainer);
        } else {
            this.remove(this._optionsContainer);
            this.add(this._loadingSavingBlock);
        }
    }
}

export default ProjectPage;
