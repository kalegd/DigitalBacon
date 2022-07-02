/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import Party from '/scripts/core/clients/Party.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const pages = [
    { "title": "Host Party", "menuPage": MenuPages.HOST_PARTY },
    { "title": "Join Party", "menuPage": MenuPages.JOIN_PARTY },
];

const connectedOptions = [
    { "title": "Update Username", "handler": "_handleUpdateUsername" },
    { "title": "Disconnect", "handler": "_handleDisconnect" },
    { "title": "Mute Myself", "handler": "_handleMuteMyself" },
    { "title": "Mute Friends", "handler": "_handleMuteFriends" },
    { "title": "Users", "type": "label" },
];

class PartyPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller);
        this._connected = false;
        this._fieldsContainer.set({ justifyContent: 'start' });
        this._peerFields = {};
        this._addFields();
    }

    _createTitleBlock() {
        this._titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Party',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.4,
            'offset': 0,
        });
    }

    _addFields() {
        this._connectedFields = [];
        this._disconnectedFields = [];
        for(let page of pages) {
            let entity = new ButtonEntity(page.title, () => {
                this._controller.pushPage(page.menuPage);
            });
            this._disconnectedFields.push(entity);
        }
        for(let option of connectedOptions) {
            let entity;
            if(option.handler) {
                entity = new ButtonEntity(option.title, () => {
                    this[option.handler]();
                });
            } else if(option.type == 'label') {
                entity = new TextEntity(option.title);
            }
            this._connectedFields.push(entity);
        }
        this._setFields(this._disconnectedFields);
    }

    _handleUpdateUsername() {
        let inputPage = this._controller.getPage(MenuPages.TEXT_INPUT);
        let username = PartyHandler.getUsername();
        inputPage.setContentWithInitialValue("Update Username", username,
            "Update",
            (username) => {
                username = username.trim();
                if(!username) {
                    PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                        text: "Username can't be blank",
                    });
                    return;
                }
                PartyHandler.setUsername(username);
                this._controller.back();
            }
        );
        this._controller.pushPage(MenuPages.TEXT_INPUT);
    }

    _handleDisconnect() {
        Party.disconnect();
        this._updateFields();
    }

    _handleMuteMyself() {
        console.log("TODO: _handleMuteMyself");
    }

    _handleMuteFriends() {
        console.log("TODO: _handleMuteFriends");
    }

    _updateFields() {
        if(PartyHandler.isPartyActive()) {
            if(!this._checkPeers() && this._connected) return;
            this._setFields(this._connectedFields.concat(
                Object.values(this._peerFields)));
            this._connected = true;
        } else {
            this._setFields(this._disconnectedFields);
            this._connected = false;
        }
    }

    _checkPeers() {
        let different = false;
        let peers = PartyHandler.getPeers();
        for(let peerId in peers) {
            if(!(peerId in this._peerFields)) {
                let peer = peers[peerId];
                this._peerFields[peerId] = new PeerEntity(peer, peer.username);
                different = true;
            }
        }
        for(let peerId in this._peerFields) {
            if(!(peerId in peers)) {
                this._peerFields[peerId].removeFromScene();
                delete this._peerFields[peerId];
                different = true;
            }
        }
        return different;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            if(!this._connected) this._updateFields();
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_ENDED, () => {
            if(this._connected) this._updateFields();
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_CONNECTED, (message) => {
            if(!this._connected) return;
            let peer = message.peer;
            let peerEntity = new PeerEntity(peer);
            this._peerFields[peer.id] = peerEntity;
            this._fields.push(peerEntity);
            if(this._fields.length != this._lastItemIndex + 2) return;
            this._removeCurrentFields();
            this._lastItemIndex = this._firstItemIndex - 1;
            this._loadNextPage();
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_DISCONNECTED, (message) =>{
            if(!this._connected) return;
            let peer = message.peer;
            let peerEntity = this._peerFields[peer.id];
            if(!peerEntity) return;
            this._removeField(peerEntity);
            delete this._peerFields[peer.id];
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_USERNAME_UPDATED,
            (message) => {
                if(!this._connected) return;
                let peer = message.peer;
                this._peerFields[peer.id].setUsername(peer.username);
            }
        );
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.PARTY_STARTED);
        PubSub.unsubscribe(this._id, PubSubTopics.PARTY_ENDED);
        PubSub.unsubscribe(this._id, PubSubTopics.PEER_CONNECTED);
        PubSub.unsubscribe(this._id, PubSubTopics.PEER_DISCONNECTED);
        PubSub.unsubscribe(this._id, PubSubTopics.PEER_USERNAME_UPDATED);
    }

    back() {
        this._removeSubscriptions();
        super.back();
    }

    addToScene(scene, parentInteractable) {
        this._updateFields();
        this._addSubscriptions();
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        this._removeSubscriptions();
        super.removeFromScene();
    }
}

class MenuEntity extends PointerInteractableEntity {
    constructor() {
        super();
    }

    getHeight() {
        return 0.039;
    }

    updateFromSource() {
        //Do nothing
    }

    deactivate() {
        //Do nothing
    }
}

class ButtonEntity extends MenuEntity {
    constructor(title, action) {
        super();
        this._object = ThreeMeshUIHelper.createButtonBlock({
            'text': title,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'margin': 0.002,
        });
        this._pointerInteractable = new PointerInteractable(this._object,
            action);
    }
}

class TextEntity extends MenuEntity {
    constructor(text) {
        super();
        this._object = ThreeMeshUIHelper.createTextBlock({
            'text': text,
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'offset': 0,
        });
    }

    getHeight() {
        return 0.045;
    }
}

class PeerEntity extends MenuEntity {
    constructor(peer, username) {
        super();
        this._peer = peer;
        this._object = ThreeMeshUIHelper.createTextBlock({
            'text': username || '...',
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.3,
            'offset': 0,
            'margin': 0.002,
        });
    }

    getPeer() {
        return this._peer;
    }

    setUsername(username) {
        username = stringWithMaxLength(username || '...', 12);
        if(this._object.children[1].content != username) {
            this._object.children[1].set({ content: username });
        }
    }

    addToScene(scene, interactableParent) {
        this.setUsername(this._peer.username);
        super.addToScene(scene, interactableParent);
    }
}

export default PartyPage;
