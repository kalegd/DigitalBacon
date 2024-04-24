/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';

let ATTACHED_COMPONENTS = {};

PubSub.subscribe('SYSTEM_MODULE', PubSubTopics.COMPONENT_ATTACHED, (message) =>{
    if(!(message.componentAssetId in ATTACHED_COMPONENTS))
        ATTACHED_COMPONENTS[message.componentAssetId] = {};
    ATTACHED_COMPONENTS[message.componentAssetId][message.id] = message;
});

PubSub.subscribe('SYSTEM_MODULE', PubSubTopics.COMPONENT_DETACHED, (message) =>{
    if(!(message.componentAssetId in ATTACHED_COMPONENTS)) return;
    delete ATTACHED_COMPONENTS[message.componentAssetId][message.id];
});

PubSub.subscribe('SYSTEM_MODULE', PubSubTopics.PROJECT_LOADING, (done) => {
    if(!done) ATTACHED_COMPONENTS = {};
});

export default class System extends Asset {
    constructor(params = {}) {
        super(params);
        this._subscriptionTopics = [];
    }

    _getDefaultName() {
        return 'System';
    }

    _addSystemSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.USER_READY, () => {
            this._onUserReady();
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_READY, (message) => {
            this._onPeerReady(message.peer);
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_DISCONNECTED, (message) =>{
            this._onPeerDisconnected(message.peer);
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            this._onPartyStarted(PartyHandler.isHost());
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_ENDED, () => {
            this._onPartyEnded();
        });
        this._subscriptionTopics.push(PubSubTopics.USER_READY);
        this._subscriptionTopics.push(PubSubTopics.PEER_READY);
        this._subscriptionTopics.push(PubSubTopics.PARTY_STARTED);
        this._subscriptionTopics.push(PubSubTopics.PARTY_ENDED);
    }

    _removeSubscriptions() {
        for(let subscription of this._subscriptionTopics) {
            PubSub.unsubscribe(this._id, subscription);
        }
        this._subscriptionTopics = [];
    }

    _listenForComponentAdded(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        let topic = PubSubTopics.COMPONENT_ADDED + ':' + componentAssetId;
        PubSub.subscribe(this._id, topic, (message) => { handler(message); });
        this._subscriptionTopics.push(topic);
    }

    _listenForComponentAttached(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        let topic = PubSubTopics.COMPONENT_ATTACHED + ':' + componentAssetId;
        PubSub.subscribe(this._id, topic, (message) => { handler(message); });
        this._subscriptionTopics.push(topic);
        if(componentAssetId in ATTACHED_COMPONENTS) {
            for(let id in ATTACHED_COMPONENTS[componentAssetId]) {
                handler(ATTACHED_COMPONENTS[componentAssetId][id]);
            }
        }
    }

    _listenForComponentDeleted(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        let topic = PubSubTopics.COMPONENT_DELETED + ':' + componentAssetId;
        PubSub.subscribe(this._id, topic, (message) => { handler(message); });
        this._subscriptionTopics.push(topic);
    }

    _listenForComponentDetached(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        let topic = PubSubTopics.COMPONENT_DETACHED + ':' + componentAssetId;
        PubSub.subscribe(this._id, topic, (message) => { handler(message); });
        this._subscriptionTopics.push(topic);
    }

    _listenForComponentUpdated(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        let topic = PubSubTopics.COMPONENT_UPDATED + ':' + componentAssetId;
        PubSub.subscribe(this._id, topic, (message) => { handler(message); });
        this._subscriptionTopics.push(topic);
    }

    _onUserReady() {}
    _onPeerReady() {}
    _onPeerDisconnected() {}
    _onPeerMessage(_p, _m) {}
    _onPeerBufferMessage(_p, _m) {}
    _onPartyStarted() {}
    _onPartyEnded() {}

    _publishPeerMessage(message, skipQueue) {
        PartyHandler.publishInternalMessage(this._id, message, skipQueue);
    }

    _publishPeerBufferMessage(message, skipQueue) {
        PartyHandler.publishInternalBufferMessage(this._idBytes, message,
            skipQueue);
    }

    get description() {
        console.error("get System.description should be overridden");
        return '';
    }

    needsUpdates() {
        return false;
    }

    onAddToProject() {
        this._addSystemSubscriptions();
        PartyHandler.addInternalMessageHandler(this._id,
            (p, m) => this._onPeerMessage(p, m));
        PartyHandler.addInternalBufferMessageHandler(this._id,
            (p, m) => this._onPeerBufferMessage(p, m));
    }

    onRemoveFromProject() {
        this._removeSubscriptions();
    }

    static assetType = AssetTypes.SYSTEM;
}
