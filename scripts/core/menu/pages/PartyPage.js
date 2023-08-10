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
import { Colors, Fonts, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
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

    _handleDisplayUsernames() {
        this._displayingUsernames = !this._displayingUsernames;
        let block = this._connectedFields[0].getObject();
        if(this._displayingUsernames) {
            block.children[1].set({ content: 'Hide Usernames' });
        } else {
            block.children[1].set({ content: 'Display Usernames' });
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
        let block = this._connectedFields[2].getObject();
        if(this._mutedMyself) {
            block.children[1].set({ content: 'Unmute Myself' });
        } else {
            block.children[1].set({ content: 'Mute Myself' });
        }
        for(let peerId in this._peerFields) {
            this._peerFields[peerId].toggleMyselfMuted(this._mutedMyself);
        }
    }

    _handleMuteFriends() {
        this._mutedPeers = !this._mutedPeers;
        let block = this._connectedFields[3].getObject();
        if(this._mutedPeers) {
            block.children[1].set({ content: 'Unmute Friends' });
        } else {
            block.children[1].set({ content: 'Mute Friends' });
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
                this._peerFields[peerId].removeFromScene();
                delete this._peerFields[peerId];
                different = true;
            } else {
                this._peerFields[peerId].setUsername(peers[peerId].username);
            }
        }
        return different;
    }

    _abdicateHost(peerId) {
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
        this._pointerInteractable = new PointerInteractable(this._object, true);
        this._pointerInteractable.addAction(action);
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
            'margin': 0.002,
        });
    }

    getHeight() {
        return 0.045;
    }
}

class PeerEntity extends MenuEntity {
    constructor(peer, username, controller, designateHostCallback) {
        super();
        this._peer = peer;
        this._controller = controller;
        this._designateHostCallback = designateHostCallback;
        this._mutedMyself = false;
        this._mutedPeer = false;
        this._object = new ThreeMeshUI.Block({
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'height': 0.035,
            'width': 0.31,
            'contentDirection': 'row',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
            'offset': 0,
            'margin': 0.002,
        });
        this._addContent(username);
    }

    _addContent(username) {
        this._usernameBlock = ThreeMeshUIHelper.createButtonBlock({
            'text': username || '...',
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'fontSize': FontSizes.body,
            'height': 0.035,
            'width': 0.228,
            'offset': 0,
            'margin': 0.002,
        });
        let muteParams = {
            'backgroundTexture': Textures.microphoneIcon,
            'backgroundTextureScale': 0.85,
            'height': 0.035,
            'width': 0.035,
            'margin': 0.002,
        };
        this._muteMyselfButton =ThreeMeshUIHelper.createButtonBlock(muteParams);
        muteParams['backgroundTexture'] = Textures.headphonesIcon;
        this._mutePeerButton = ThreeMeshUIHelper.createButtonBlock(muteParams);
        this._muteMyselfButton.children[1].set({backgroundColor: Colors.green});
        this._mutePeerButton.children[1].set({ backgroundColor: Colors.green });
        if(!PartyHandler.isHost()) {
            this._usernameBlock.set({ backgroundOpacity: 0 });
        }

        this._object.add(this._usernameBlock);
        this._object.add(this._muteMyselfButton);
        this._object.add(this._mutePeerButton);
        this._addInteractables();
    }

    _addInteractables() {
        this._usernameInteractable = new PointerInteractable(
            this._usernameBlock, true);
        this._usernameInteractable.addAction(() => {
            let peerPage = this._controller.getPage(MenuPages.PEER);
            peerPage.setContent(this._peer, this._designateHostCallback);
            this._controller.pushPage(MenuPages.PEER);
        });
        this._muteMyselfInteractable = new PointerInteractable(
            this._muteMyselfButton, true);
        this._muteMyselfInteractable.addAction(() => this.toggleMyselfMuted());
        this._mutePeerInteractable = new PointerInteractable(
            this._mutePeerButton, true);
        this._mutePeerInteractable.addAction(() => this.togglePeerMuted());
        if(PartyHandler.isHost()) {
            this._pointerInteractable.addChild(this._usernameInteractable);
        }
        this._pointerInteractable.addChild(this._muteMyselfInteractable);
        this._pointerInteractable.addChild(this._mutePeerInteractable);
    }

    toggleHost(isHost) {
        if(isHost) {
            this._pointerInteractable.addChild(this._usernameInteractable);
            this._usernameBlock.set({ backgroundOpacity: 0.7 });
        } else {
            this._pointerInteractable.removeChild(this._usernameInteractable);
            this._usernameBlock.set({ backgroundOpacity: 0 });
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
        this._muteMyselfButton.children[1].set({ backgroundColor: color });
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
        this._mutePeerButton.children[1].set({ backgroundColor: color });
    }

    setUsername(username) {
        username = stringWithMaxLength(username || '...', 12);
        if(this._usernameBlock.children[1].content != username) {
            this._usernameBlock.children[1].set({ content: username });
        }
    }

    addToScene(scene, interactableParent) {
        this.setUsername(this._peer.username);
        super.addToScene(scene, interactableParent);
    }
}

export default PartyPage;
