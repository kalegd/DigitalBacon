/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';
import { TextureLoader } from 'three';

class AcknowledgementsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._sketchfabAssets = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._createPreviousAndNextButtons();
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': ' ',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.3,
        });
        this._container.add(this._titleBlock);

        this._noAcknowledgements = ThreeMeshUIHelper.createTextBlock({
            'text': 'No Acknowledgements to Display',
            'fontSize': 0.025,
            'height': 0.04,
            'width': 0.4,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });

        this._acknowledgementsContainer = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'row',
            'justifyContent': 'center',
            'backgroundOpacity': 0,
            'offset': 0,
        });

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.31,
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

        this._sourceButton = ThreeMeshUIHelper.createButtonBlock({
            'text': "View Source",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'margin': 0.006,
        });
        columnBlock.add(this._sourceButton);
        this._sourceInteractable = new PointerInteractable(
            this._sourceButton, () => {
                if(global.deviceType == 'XR') SessionHandler.exitXRSession();
                window.open(this._sketchfabAssets[this._page]['Source'],
                    '_blank');
            });
        this._containerInteractable.addChild(this._sourceInteractable);
        this._container.add(this._acknowledgementsContainer);
        this._acknowledgementsContainer.add(this._previousButton);
        this._acknowledgementsContainer.add(columnBlock);
        this._acknowledgementsContainer.add(this._nextButton);
    }

    _createPreviousAndNextButtons() {
        this._previousButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '<',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._nextButton = ThreeMeshUIHelper.createButtonBlock({
            'text': '>',
            'fontSize': 0.03,
            'height': 0.04,
            'width': 0.04,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._previousInteractable = new PointerInteractable(
            this._previousButton,
            () => {
                this._page += this._sketchfabAssets.length - 1;
                this._page %= this._sketchfabAssets.length;
                this._setAsset();
            });
        this._nextInteractable = new PointerInteractable(this._nextButton,
            () => {
                this._page += 1;
                this._page %= this._sketchfabAssets.length;
                this._setAsset();
            });
    }

    setAssets(sketchfabAssets) {
        this._sketchfabAssets = sketchfabAssets;
        this._page = 0;
        if(sketchfabAssets.length > 1) {
            this._previousButton.visible = true;
            this._nextButton.visible = true;
            this._containerInteractable.addChild(this._previousInteractable);
            this._containerInteractable.addChild(this._nextInteractable);
        } else {
            this._previousButton.visible = false;
            this._nextButton.visible = false;
            this._containerInteractable.removeChild(this._previousInteractable);
            this._containerInteractable.removeChild(this._nextInteractable);
            if(sketchfabAssets.length == 0) {
                this._container.remove(this._acknowledgementsContainer);
                this._container.add(this._noAcknowledgements);
                return;
            }
        }
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
        if(sketchfabAsset['Source']) {
            this._sourceButton.visible = true;
            this._containerInteractable.addChild(this._sourceInteractable);
        } else {
            this._sourceButton.visible = false;
            this._containerInteractable.removeChild(
                this._sourceInteractable);
        }
    }
}

export default AcknowledgementsPage;
