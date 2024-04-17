/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Party from '/scripts/core/clients/Party.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { createSmallButton, createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import { Colors, Styles, Textures } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import { Text } from '/scripts/DigitalBacon-UI.js';

const pages = [
    { "title": "Host Party", "menuPage": MenuPages.HOST_PARTY },
    { "title": "Join Party", "menuPage": MenuPages.JOIN_PARTY },
];

const connectedOptions = [
    { "title": "Display Usernames", "handler": "_handleDisplayUsernames" },
    { "title": "Update Username", "handler": "_handleUpdateUsername" },
    { "title": "Mute Myself", "handler": "_handleMuteMyself" },
    { "title": "Mute Friends", "handler": "_handleMuteFriends" },
    { "title": "Disconnect", "handler": "_handleDisconnect" },
    { "title": "Users", "type": "label" },
];

class PartyPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller);
        this._connected = false;
        this._displayingUsernames = false;
        this._mutedMyself = false;
        this._mutedPeers = false;
        this._fieldsContainer.justifyContent = 'start';
        this._peerFields = {};
        this._addFields();
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

    _handleDisplayUsernames() {
        this._displayingUsernames = !this._displayingUsernames;
        let field = this._connectedFields[0];
        if(this._displayingUsernames) {
            field.textComponent.text = 'Hide Usernames';
        } else {
            field.textComponent.text = 'Display Usernames';
        }
        PartyHandler.setDisplayingUsernames(this._displayingUsernames);
    }

    _handleUpdateUsername() {
        let inputPage = this._controller.getPage(MenuPages.TEXT_INPUT);
        let username = global.userController.getUsername();
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
                global.userController.setUsername(username);
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
        this._mutedMyself = !this._mutedMyself;
        let field = this._connectedFields[2];
        if(this._mutedMyself) {
            field.textComponent.text = 'Unmute Myself';
        } else {
            field.textComponent.text = 'Mute Myself';
        }
        for(let peerId in this._peerFields) {
            this._peerFields[peerId].toggleMyselfMuted(this._mutedMyself);
        }
    }

    _handleMuteFriends() {
        this._mutedPeers = !this._mutedPeers;
        let field = this._connectedFields[3];
        if(this._mutedPeers) {
            field.textComponent.text = 'Unmute Friends';
        } else {
            field.textComponent.text = 'Mute Friends';
        }
        for(let peerId in this._peerFields) {
            this._peerFields[peerId].togglePeerMuted(this._mutedPeers);
        }
    }

    _updateFields() {
        if(PartyHandler.isPartyActive()) {
            if(!this._checkPeers() && this._connected) return;
            this._setFields(this._connectedFields.concat(
                Object.values(this._peerFields)));
            this._connected = true;
        } else {
            for(let peerId in this._peerFields) {
                delete this._peerFields[peerId];
            }
            this._setFields(this._disconnectedFields);
            this._connected = false;
        }
    }

    _checkPeers() {
        let different = false;
        let peers = PartyHandler.getPeers();
        for(let peerId in peers) {
            if(!(peerId in this._peerFields) && peers[peerId].rtc) {
                let peer = peers[peerId];
                this._peerFields[peerId] = new PeerEntity(peer, peer.username,
                    this._controller, (peerId) => this._abdicateHost(peerId));
                if(this._mutedMyself)
                    this._peerFields[peerId].toggleMyselfMuted(true);
                if(this._mutedPeers)
                    this._peerFields[peerId].togglePeerMuted(true);
                different = true;
            }
        }
        for(let peerId in this._peerFields) {
            if(!(peerId in peers)) {
                this._fieldsContainer.remove(this._peerFields[peerId]);
                delete this._peerFields[peerId];
                different = true;
            } else {
                this._peerFields[peerId].setUsername(peers[peerId].username);
            }
        }
        return different;
    }

    _abdicateHost() {
        for(let peerId in this._peerFields) {
            this._peerFields[peerId].toggleHost(false);
        }
    }

    _handlePeerConnected(message) {
        if(!this._connected) return;
        let peer = message.peer;
        let peerEntity = new PeerEntity(peer, peer.username,
            this._controller, (peerId) => this._abdicateHost(peerId));
        if(this._mutedMyself) peerEntity.toggleMyselfMuted(true);
        if(this._mutedPeers) peerEntity.togglePeerMuted(true);
        this._peerFields[peer.id] = peerEntity;
        this._fields.push(peerEntity);
        if(this._fields.length != this._lastItemIndex + 2) return;
        this._removeCurrentFields();
        this._lastItemIndex = this._firstItemIndex - 1;
        this._loadNextPage();
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.BECOME_PARTY_HOST, () => {
            for(let peerId in this._peerFields) {
                this._peerFields[peerId].toggleHost(true);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            if(!this._connected) this._updateFields();
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_ENDED, () => {
            if(this._connected) this._updateFields();
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_CONNECTED, (message) => {
            this._handlePeerConnected(message);
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

    _onAdded() {
        this._updateFields();
        this._addSubscriptions();
        super._onAdded();
    }

    _onRemoved() {
        this._removeSubscriptions();
        super._onRemoved();
    }
}

class ButtonEntity extends MenuField {
    constructor(title, action) {
        super();
        this.height = 0.043;
        let button = createWideButton(title);
        button.onClick = action;
        this.add(button);
        this.textComponent = button.textComponent;
    }
}

class TextEntity extends MenuField {
    constructor(text) {
        super();
        this.height = 0.043;
        this.add(new Text(text, Styles.bodyText, {
            height: 0.035,
            width: 0.3,
        }));
    }
}

class PeerEntity extends MenuField {
    constructor(peer, username, controller, designateHostCallback) {
        super();
        this.height = 0.043;
        this._peer = peer;
        this._controller = controller;
        this._designateHostCallback = designateHostCallback;
        this._mutedMyself = false;
        this._mutedPeer = false;
        this._addContent(username);
    }

    _addContent(username) {
        username = stringWithMaxLength(username || '...', 12);
        this._usernameBlock = createWideButton(username || '...');
        this._usernameBlock.width = 0.228;
        this._muteMyselfButton =createSmallButton(Textures.microphoneIcon,0.75);
        this._muteMyselfButton.height = 0.035;
        this._muteMyselfButton.width = 0.035;
        this._mutePeerButton = createSmallButton(Textures.headphonesIcon, 0.75);
        this._mutePeerButton.height = 0.035;
        this._mutePeerButton.width = 0.035;
        this._muteMyselfButton.material.color.set(Colors.green);
        this._mutePeerButton.material.color.set(Colors.green);
        if(!PartyHandler.isHost())
            this._usernameBlock.backgroundVisible = false;

        this.add(this._usernameBlock);
        this.add(this._muteMyselfButton);
        this.add(this._mutePeerButton);
        this._addInteractableEventListeners();
    }

    _addInteractableEventListeners() {
        this._usernameClickCallback = () => {
            let peerPage = this._controller.getPage(MenuPages.PEER);
            peerPage.setContent(this._peer, this._designateHostCallback);
            this._controller.pushPage(MenuPages.PEER);
        };
        if(PartyHandler.isHost())
            this._usernameBlock.onClick = this._usernameClickCallback;
        this._muteMyselfButton.onClick = () => this.toggleMyselfMuted();
        this._mutePeerButton.onClick = () => this.togglePeerMuted();
    }

    toggleHost(isHost) {
        if(isHost) {
            this._usernameBlock.onClick = this._usernameClickCallback;
            this._usernameBlock.backgroundVisible = true;
        } else {
            this._usernameBlock.onClick = null;
            this._usernameBlock.backgroundVisible = false;
        }
    }

    toggleMyselfMuted(muted) {
        if(muted == this._mutedMyself) return;
        this._mutedMyself = !this._mutedMyself;
        let color;
        if(this._mutedMyself) {
            color = Colors.red;
        } else {
            color = Colors.green;
        }
        this._peer.rtc.toggleMyselfMuted(this._mutedMyself);
        this._muteMyselfButton.material.color.set(color);
    }

    togglePeerMuted(muted) {
        if(muted == this._mutedPeer) return;
        this._mutedPeer = !this._mutedPeer;
        let color;
        if(this._mutedPeer) {
            color = Colors.red;
        } else {
            color = Colors.green;
        }
        this._peer.rtc.togglePeerMuted(this._mutedPeer);
        this._mutePeerButton.material.color.set(color);
    }

    setUsername(username) {
        username = stringWithMaxLength(username || '...', 12);
        if(this._usernameBlock.textComponent.text != username)
            this._usernameBlock.textComponent.text = username;
    }

    _onAdded() {
        this.setUsername(this._peer.username);
        super._onAdded();
    }
}

export default PartyPage;
