/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PrimitiveAmbientLight from '/scripts/core/assets/PrimitiveAmbientLight.js';
import GoogleDrive from '/scripts/core/clients/GoogleDrive.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PaginatedPage from '/scripts/core/menu/pages/PaginatedPage.js';

const OPTIONS = {
    'New Project': '_newProject',
    'Load from Device': '_localLoad',
    'Load from Google Drive': '_googleDriveLoad',
    'Save to Device': '_localSave',
    'Save to Google Drive': '_googleDriveSave',
    'Sign out of Google Drive': '_googleDriveSignout',
}

class ProjectPage extends PaginatedPage {
    constructor(controller) {
        super(controller, false, true);
        this._items = Object.keys(OPTIONS).slice(0, -1);
        this._addPageContent();
        this._addSubscriptions();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Project File',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        this._loadingSavingBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Project Loading...',
            'fontSize': 0.025,
            'height': 0.04,
            'width': 0.4,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });

        this._addList();
    }

    _getItemName(item) {
        return item;
    }

    _handleItemInteraction(item) {
        this[OPTIONS[item]]();
    }

    _refreshItems() {
        if(GoogleDrive.isSignedIn()) {
            this._items = Object.keys(OPTIONS);
        } else {
            this._items = Object.keys(OPTIONS).slice(0, -1);
        }
    }

    _newProject() {
        if(PartyHandler.isPartyActive() && !PartyHandler.isHost()) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Only Host Can Load Projects',
            });
            return;
        }
        ProjectHandler.reset();
        let ambientLight = new PrimitiveAmbientLight({
            'visualEdit': false,
        });
        ProjectHandler.addLight(ambientLight, ambientLight.getAssetId(), true);
        GoogleDrive.clearActiveFile();
        if(PartyHandler.isPartyActive() && PartyHandler.isHost()) {
            PartyHandler.sendProject();
        }
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
        UploadHandler.triggerUpload();
    }

    _googleDriveSave() {
        if(GoogleDrive.isSignedIn()) {
            if(GoogleDrive.hasActiveFile()) {
                this._updateSaving(false);
                PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, false);
                GoogleDrive.save(
                    ProjectHandler.exportProject(),
                    () => { this._saveSuccessCallback(); },
                    () => { this._saveErrorCallback(); });
                return;
            }
            let inputPage = this._controller.getPage(MenuPages.TEXT_INPUT);
            inputPage.setContent("Save Project As", "Filename", "Save",
                (projectName) => {
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
        } else {
            if(global.deviceType == 'XR') SessionHandler.exitXRSession();
            GoogleDrive.handleAuthButton(
                () => { this._handleGoogleAuthResponse(); });
        }
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
            if(global.deviceType == 'XR') SessionHandler.exitXRSession();
            GoogleDrive.handleAuthButton(
                () => { this._handleGoogleAuthResponse(); });
        }
    }

    _handleGoogleAuthResponse() {
        this._refreshItems();
        this._updateItemsGUI();
    }

    _googleDriveSignout() {
        if(GoogleDrive.isSignedIn()) {
            GoogleDrive.handleSignoutButton();
        }
        this._page = 0;
        this._refreshItems();
        this._updateItemsGUI();
    }

    _handleLocalFile(file) {
        this._updateLoading(false);
        PubSub.publish(this._id, PubSubTopics.PROJECT_SAVING, false);
        JSZip.loadAsync(file).then((jsZip) => {
            GoogleDrive.clearActiveFile();
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
    }

    _updateLoading(finished) {
        this._loadingSavingBlock.children[1].set({
            content: "Project Loading..."
        });
        this._updateLoadingSaving(finished);
    }

    _updateSaving(finished) {
        this._loadingSavingBlock.children[1].set({
            content: "Project Saving..."
        });
        this._updateLoadingSaving(finished);
    }

    _updateLoadingSaving(finished) {
        if(finished) {
            this._container.remove(this._loadingSavingBlock);
            this._container.add(this._optionsContainer);
            this._container.update(false, false, true);
        } else {
            this._container.remove(this._optionsContainer);
            this._container.add(this._loadingSavingBlock);
        }
    }

    addToScene(scene, parentInteractable) {
        UploadHandler.listenForProjectFile((file) => {
            this._handleLocalFile(file);
        });
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        UploadHandler.stopListening();
        super.removeFromScene();
    }

}

export default ProjectPage;
