/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { Styles, Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Image, Text, Span } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import { TextureLoader } from 'three';

class AcknowledgementsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._page = 0;
        this._acknowledgements = [];
        this._addPageContent();
    }

    _addPageContent() {
        this._createPreviousAndNextButtons();
        this._titleBlock = new Text('', Styles.title);
        this.add(this._titleBlock);

        this._noAcknowledgements = new Text('No Acknowledgements to Display',
            Styles.bodyText);

        this._acknowledgementsContainer = new Span({
            height: 0.2,
            justifyContent: 'spaceEvenly',
            width: 0.45,
        });

        let columnBlock = new Div({
            height: 0.2,
            justifyContent: 'spaceBetween',
            width: 0.31,
        });

        this._textureBlock = new Image(Textures.ellipsisIcon, {
            height: 0.085,
            textureFit: 'cover',
            width: 0.1,
        });
        columnBlock.add(this._textureBlock);

        this._authorBlock = new Text('Author: ', Styles.bodyText);
        columnBlock.add(this._authorBlock);

        this._licenseBlock = new Text('License: ', Styles.bodyText);
        columnBlock.add(this._licenseBlock);

        this._sourceButtonParent = new Div();
        this._sourceButton = createWideButton('View Source');
        this._sourceButtonParent.add(this._sourceButton);
        columnBlock.add(this._sourceButtonParent);
        this._sourceButton.onClickAndTouch = () => {
            if(global.deviceType == 'XR') SessionHandler.exitXRSession();
            window.open(this._acknowledgements[this._page]['Source URL'],
                '_blank');
        };
        this.add(this._acknowledgementsContainer);
        this._acknowledgementsContainer.add(this._previousButtonParent);
        this._acknowledgementsContainer.add(columnBlock);
        this._acknowledgementsContainer.add(this._nextButtonParent);
    }

    _createPreviousAndNextButtons() {
        this._previousButtonParent = new Div();
        this._previousButton = createSmallButton('<');
        this._previousButton.onClickAndTouch = () => {
            this._page += this._acknowledgements.length - 1;
            this._page %= this._acknowledgements.length;
            this._setAsset();
        };
        this._previousButtonParent.add(this._previousButton);
        this._nextButtonParent = new Div();
        this._nextButton = createSmallButton('>');
        this._nextButton.onClickAndTouch = () => {
            this._page += 1;
            this._page %= this._acknowledgements.length;
            this._setAsset();
        };
        this._nextButtonParent.add(this._nextButton);
    }

    _refreshAssets() {
        this._acknowledgements = SettingsHandler.getAcknowledgements();
        if(this._acknowledgements.length > 1) {
            if(this._page >= this._acknowledgements.length) this._page = 0;
            this._previousButtonParent.add(this._previousButton);
            this._nextButtonParent.add(this._nextButton);
        } else {
            this._previousButtonParent.remove(this._previousButton);
            this._nextButtonParent.remove(this._nextButton);
            if(this._acknowledgements.length == 0) {
                this.remove(this._acknowledgementsContainer);
                this.add(this._noAcknowledgements);
                return;
            }
        }
        this._setAsset();
    }

    _setAsset() {
        let page = this._page;
        let acknowledgement = this._acknowledgements[page];
        this._titleBlock.text = acknowledgement['Asset'];
        if(acknowledgement['Author']) {
            this._authorBlock.text = 'Author: ' + acknowledgement['Author'];
            this._authorBlock.visible = true;
        } else {
            this._authorBlock.visible = false;
        }
        if(acknowledgement['License']) {
            this._licenseBlock.text = 'License: ' + acknowledgement['License'];
            this._licenseBlock.visible = true;
        } else {
            this._licenseBlock.visible = false;
        }
        if(acknowledgement.previewTexture) {
            this._textureBlock.updateTexture(acknowledgement.previewTexture);
            this._textureBlock.visible = true;
        } else if(acknowledgement['Preview Image URL']
            && !acknowledgement.isLoadingTexture)
        {
            this._textureBlock.visible = false;
            acknowledgement.isLoadingTexture = true;
            new TextureLoader().load(acknowledgement['Preview Image URL'],
                (texture) => {
                    if(this._page == page) {
                        acknowledgement.previewTexture = texture;
                        this._setAsset();
                    }
                });
        } else {
            this._textureBlock.visible = false;
        }
        if(acknowledgement['Source URL']) {
            this._sourceButtonParent.add(this._sourceButton);
        } else {
            this._sourceButtonParent.remove(this._sourceButton);
        }
    }

    _onAdded() {
        this._refreshAssets();
        super._onAdded();
    }
}

export default AcknowledgementsPage;
