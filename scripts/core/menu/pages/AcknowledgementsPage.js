/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';
import { TextureLoader } from 'three';

class AcknowledgementsPage extends MenuPage {
    constructor(controller) {
        super(controller, false, true);
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

        this._sketchfabButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "View on Sketchfab",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'margin': 0.006,
        });
        columnBlock.add(this._sketchfabButton);
        this._sketchfabInteractable = new PointerInteractable(
            this._sketchfabButton, () => {
                if(global.deviceType == 'XR') SessionHandler.exitXRSession();
                window.open(this._sketchfabAssets[this._page]['Sketchfab Link'],
                    '_blank');
            });
        this._containerInteractable.addChild(this._sketchfabInteractable);
        this._container.add(columnBlock);
    }

    setAssets(sketchfabAssets) {
        this._sketchfabAssets = sketchfabAssets;
        this._page = 0;
        this._setAsset();
    }

    _setAsset() {
        let page = this._page;
        let sketchfabAsset = this._sketchfabAssets[page];
        this._titleBlock.children[1].set({ content: sketchfabAsset['Name'] });
        if(sketchfabAsset['Author']) {
            this._authorBlock.children[1].set({
                content: 'Author: ' + sketchfabAsset['Author'],
            });
            this._authorBlock.visible = true;
        } else {
            this._authorBlock.visible = false;
        }
        if(sketchfabAsset.previewTexture) {
            this._textureBlock.set({
                backgroundTexture: sketchfabAsset.previewTexture
            });
            this._textureBlock.visible = true;
        } else if(sketchfabAsset['Preview Image URL']
            && !sketchfabAsset.isLoadingTexture)
        {
            this._textureBlock.visible = false;
            sketchfabAsset.isLoadingTexture = true;
            new TextureLoader().load(sketchfabAsset['Preview Image URL'],
                (texture) => {
                    if(this._page == page) {
                        sketchfabAsset.previewTexture = texture;
                        this._setAsset();
                    }
                });
        } else {
            this._textureBlock.visible = false;
        }
        if(sketchfabAsset['Sketchfab Link']) {
            this._sketchfabButton.visible = true;
            this._containerInteractable.addChild(this._sketchfabInteractable);
        } else {
            this._sketchfabButton.visible = false;
            this._containerInteractable.removeChild(
                this._sketchfabInteractable);
        }
    }
}

export default AcknowledgementsPage;
