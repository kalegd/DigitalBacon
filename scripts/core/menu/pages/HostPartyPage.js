/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { FontSizes, Styles } from '/scripts/core/helpers/constants.js';
import { createTextInput, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/scripts/DigitalBacon-UI.js';

class HostPartyPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = new Text('Host Party', Styles.title);
        this.add(titleBlock);

        this._contentBlock = new Div();
        this._textInput = createTextInput({
            borderRadius: 0.02,
            fontSize: FontSizes.body,
            height: 0.04,
            marginBottom: 0.008,
            marginTop: 0.01,
            width: 0.4,
        });
        this._textInput.onBlur = () => { global.keyboardLock = false; };
        this._textInput.onEnter = () => {
            this._textInput.blur();
            this._hostParty();
        };
        this._textInput.onFocus = () => { global.keyboardLock = true };
        let button = createWideButton('Host');
        button.width = 0.2;
        button.onClick = () => this._hostParty();
        this._contentBlock.add(this._textInput);
        this._contentBlock.add(button);
        this.add(this._contentBlock);

        this._connectingBlock = new Div({
            height: 0.1,
            justifyContent: 'center',
            width: 0.4,
        });
        let connectingText = new Text('Connecting...', Styles.bodyText);
        this._connectingBlock.add(connectingText);
    }

    _hostParty() {
        let roomId = this._textInput.value;
        if(roomId.length == 0) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Missing Party Name',
            });
            return;
        }
        this.remove(this._contentBlock);
        this.add(this._connectingBlock);
        this._isConnecting = true;
        PartyHandler.host(roomId, () => { this._successCallback(); },
            (m) => { this._errorCallback(m); });
    }

    _successCallback() {
        if(!this._isConnecting) return;
        this._isConnecting = false;
        this.remove(this._connectingBlock);
        this.add(this._contentBlock);
        if(this._controller.getCurrentPage() == this) this._controller.back();
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Party Started',
        });
    }

    _errorCallback(message) {
        this._isConnecting = false;
        let topic = message.topic;
        if(topic == '409-room') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Party Name Already Taken',
            });
        } else if(topic == 'rtc-timeout') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Could not connect to all other users, please try again',
            });
        } else if(topic == 'bad-auth') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Could not authenticate with Server',
            });
        } else if(topic == 'error') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Unexpected Error',
            });
        } else {
            console.error('Unexpected error message topic: ' + topic);
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Unexpected Error',
            });
        }
        this.remove(this._connectingBlock);
        this.add(this._contentBlock);
    }

    //TODO: Instead of this, we should just call errorCallback if connecting
    //      hangs in Party.js
    _onAdded() {
        if(this._isConnecting && !PartyHandler.isPartyActive()) {
            this.remove(this._connectingBlock);
            this.add(this._contentBlock);
        }
        super._onAdded();
    }
}

export default HostPartyPage;
