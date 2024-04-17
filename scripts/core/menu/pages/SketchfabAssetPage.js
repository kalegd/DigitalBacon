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
import { euler, quaternion, vector3s, Styles, Textures } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Image, Text } from '/scripts/DigitalBacon-UI.js';

class SketchfabLoginPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._staySignedIn = false;
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = new Text('', Styles.title);
        this.add(this._titleBlock);

        let columnBlock = new Div({
            height: 0.21,
            justifyContent: 'spaceBetween',
            marginTop: 0.004,
            width: 0.45,
        });

        this._textureBlock = new Image(Textures.ellipsisIcon, {
            height: 0.085,
            textureFit: 'cover',
            width: 0.1,
        });
        columnBlock.add(this._textureBlock);

        this._authorBlock = new Text('Author: ', Styles.bodyText);
        columnBlock.add(this._authorBlock);

        this._downloadButton = createWideButton('Download');
        this._downloadButtonParent = new Div({ height: 0.035 });
        this._downloadButtonParent.add(this._downloadButton);
        columnBlock.add(this._downloadButtonParent);
        this._downloadButton.onClick = () => {
            if(this._assetId) {
                this._handleDownloadSuccess(this._assetId);
                return;
            }
            this._downloadButtonParent.remove(this._downloadButton);
            Sketchfab.download(this._sketchfabAsset,
                (assetId) => { this._handleDownloadSuccess(assetId); },
                () => { this._handleDownloadError(); });
        };

        let button = createWideButton('View on Sketchfab');
        columnBlock.add(button);
        button.onClick = () => {
            if(global.deviceType == 'XR') SessionHandler.exitXRSession();
            window.open(this._sketchfabAsset.viewerUrl, '_blank');
        };

        this.add(columnBlock);
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
        this._downloadButtonParent.add(this._downloadButton);
        this._assetId = LibraryHandler.getAssetIdFromSketchfabId(
            this._sketchfabAsset.uid);
        if(assetId == this._assetId)
            this._downloadButton.textComponent.text = 'Add';
    }

    _handleDownloadError() {
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Could not download model, please try again later',
        });
        this._downloadButtonParent.add(this._downloadButton);
    }

    setContent(sketchfabAsset) {
        this._titleBlock.text = sketchfabAsset['name'];
        this._authorBlock.text = 'Author: ' + sketchfabAsset.user.username;
        if(sketchfabAsset.previewTexture) {
            this._textureBlock.updateTexture(sketchfabAsset.previewTexture);
        } else {
            this._textureBlock.updateTexture(Textures.ellipsisIcon);
        }
        this._assetId = LibraryHandler.getAssetIdFromSketchfabId(
            sketchfabAsset.uid);
        this._downloadButton.textComponent.text = (this._assetId)
            ? 'Add'
            : 'Download';
        this._sketchfabAsset = sketchfabAsset;
    }
}

export default SketchfabLoginPage;
