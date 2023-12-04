/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class JoinPartyPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Join Party',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        this._contentBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
        this._textField = new TextField({
            'height': 0.03,
            'width': 0.4,
            'text': 'Party Name',
            'onEnter': () => { this._joinParty(); },
        });
        this._textField.addToScene(this._contentBlock,
            this._containerInteractable);
        let button = ThreeMeshUIHelper.createButtonBlock({
            'text': "Join",
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.2,
            'margin': 0.002,
        });
        this._contentBlock.add(button);
        let interactable = new PointerInteractable(button, true);
        interactable.addAction(() => this._joinParty());
        this._containerInteractable.addChild(interactable);
        this._container.add(this._contentBlock);

        this._connectingBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Connecting...',
            'fontSize': 0.025,
            'height': 0.04,
            'width': 0.4,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
        });
    }

    _joinParty() {
        this._textField.deactivate();
        let roomId = this._textField.content;
        if(roomId.length == 0) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Missing Party Name',
            });
            return;
        }
        this._container.remove(this._contentBlock);
        this._container.add(this._connectingBlock);
        this._pointerInteractable.removeChild(this._containerInteractable);
        this._isConnecting = true;
        PartyHandler.join(roomId, () => { this._successCallback(); },
            (m) => { this._errorCallback(m); });
    }

    _successCallback() {
        if(!this._isConnecting) return;
        this._isConnecting = false;
        this._pointerInteractable.addChild(this._containerInteractable);
        this._container.remove(this._connectingBlock);
        this._container.add(this._contentBlock);
        this._container.update(false, false, true);
        if(this._controller.getCurrentPage() == this) this._controller.back();
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: 'Party Joined',
        });
    }

    _errorCallback(message) {
        this._isConnecting = false;
        let topic = message.topic;
        if(topic == '404-room') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Party Name Not Found',
            });
        } else if(topic == 'rtc-timeout') {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Could not connect to all other users in time, please try again',
            });
        } else if(topic == 'could-not-connect') {
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
        this._pointerInteractable.addChild(this._containerInteractable);
        this._container.remove(this._connectingBlock);
        this._container.add(this._contentBlock);
        this._container.update(false, false, true);
    }

    //TODO: Instead of this, we should just call errorCallback if connecting
    //      hangs in Party.js
    addToScene(scene, interactableParent) {
        if(this._isConnecting && !PartyHandler.isPartyActive()) {
            this._pointerInteractable.addChild(this._containerInteractable);
            this._container.remove(this._connectingBlock);
            this._container.add(this._contentBlock);
            this._container.update(false, false, true);
        }
        super.addToScene(scene, interactableParent);
    }
}

export default JoinPartyPage;
