/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Sketchfab from '/scripts/core/clients/Sketchfab.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { euler, quaternion, vector3s, FontSizes, ValidKeys } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class SketchfabLoginPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._staySignedIn = false;
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.3,
        });
        this._container.add(this._titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });

        this._textureBlock = new ThreeMeshUI.Block({
            'height': 0.085,
            'width': 0.1,
            'backgroundOpacity': 1,
        });
        columnBlock.add(this._textureBlock);

        this._authorBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Author: ',
            'fontSize': FontSizes.body,
            'height': 0.025,
            'width': 0.3,
        });
        columnBlock.add(this._authorBlock);

        this._downloadButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "Download",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'margin': 0.006,
        });
        columnBlock.add(this._downloadButton);
        this._downloadInteractable = new PointerInteractable(
            this._downloadButton, true);
        this._downloadInteractable.addAction(() => {
            if(this._assetId) {
                this._handleDownloadSuccess(this._assetId);
                return;
            }
            this._downloadButton.visible = false;
            this._containerInteractable.removeChild(
                this._downloadInteractable);
            Sketchfab.download(this._sketchfabAsset,
                (assetId) => { this._handleDownloadSuccess(assetId); },
                () => { this._handleDownloadError(); });
        });
        this._containerInteractable.addChild(this._downloadInteractable);

        let button = ThreeMeshUIHelper.createButtonBlock({
            'text': "View on Sketchfab",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'margin': 0.006,
        });
        columnBlock.add(button);
        let interactable = new PointerInteractable(button, true);
        interactable.addAction(() => {
            if(global.deviceType == 'XR') SessionHandler.exitXRSession();
            window.open(this._sketchfabAsset.viewerUrl, '_blank');
        });
        this._containerInteractable.addChild(interactable);

        this._container.add(columnBlock);
    }

    _handleDownloadSuccess(assetId) {
        this._controller
            .getPosition(vector3s[0]);
        this._controller
            .getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        let position = vector3s[0].sub(vector3s[1]).toArray();
        vector3s[0].set(0, 0, 1);
        vector3s[1].setY(0).normalize();
        quaternion.setFromUnitVectors(vector3s[0], vector3s[1]);
        euler.setFromQuaternion(quaternion);
        let rotation = euler.toArray();
        ProjectHandler.addNewAsset(assetId, {
            "assetId": assetId,
            "position": position,
            "rotation": rotation,
            "visualEdit": true,
        });
        this._downloadButton.visible = true;
        this._containerInteractable.addChild(this._downloadInteractable);
        this._assetId = LibraryHandler.getAssetIdFromSketchfabId(
            this._sketchfabAsset.uid);
        if(assetId == this._assetId)
            this._downloadButton.children[1].set({ content: 'Add'});
    }

    _handleDownloadError() {
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Could not download model, please try again later',
        });
        this._downloadButton.visible = true;
        this._containerInteractable.addChild(this._downloadInteractable);
    }

    setContent(sketchfabAsset) {
        let validCharacters = [];
        for(let c of sketchfabAsset['name']) {
            if(ValidKeys.has(c)) {
                validCharacters.push(c);
            }
        }
        sketchfabAsset['name'] = validCharacters.join('');
        this._titleBlock.children[1].set({ content: sketchfabAsset['name'] });
        this._authorBlock.children[1].set({
            content: 'Author: ' + sketchfabAsset.user.username,
        });
        if(sketchfabAsset.previewTexture) {
            this._textureBlock.set({
                backgroundTexture: sketchfabAsset.previewTexture
            });
            this._textureBlock.visible = true;
        } else {
            this._textureBlock.visible = false;
        }
        this._assetId = LibraryHandler.getAssetIdFromSketchfabId(
            sketchfabAsset.uid);
        this._downloadButton.children[1].set({
            content: (this._assetId) ? 'Add' : 'Download'
        });
        this._sketchfabAsset = sketchfabAsset;
    }
}

export default SketchfabLoginPage;
