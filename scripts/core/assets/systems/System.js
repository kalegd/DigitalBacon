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

const ATTACHED_COMPONENTS = {};

PubSub.subscribe('SYSTEM_MODULE', PubSubTopics.COMPONENT_ATTACHED, (message) =>{
    if(!(message.componentAssetId in ATTACHED_COMPONENTS))
        ATTACHED_COMPONENTS[message.componentAssetId] = {};
    ATTACHED_COMPONENTS[message.componentAssetId][message.id] = message;
});

PubSub.subscribe('SYSTEM_MODULE', PubSubTopics.COMPONENT_DETACHED, (message) =>{
    if(!(message.componentAssetId in ATTACHED_COMPONENTS)) return;
    delete ATTACHED_COMPONENTS[message.componentAssetId][message.id];
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
        PubSub.subscribe(this._id, PubSubTopics.PEER_READY, (message) => {
            this._onPeerReady(message.peer);
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            this._onPartyStarted(PartyHandler.isHost());
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_ENDED, () => {
            this._onPartyEnded();
        });
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

    _onPeerReady() {}
    _onPartyStarted() {}
    _onPartyEnded() {}

    getDescription() {
        console.error("System.getDescription() should be overridden");
        return '';
    }

    needsUpdates() {
        return false;
    }

    addToScene() {
        this._addSystemSubscriptions();
    }

    removeFromScene() {
        this._removeSubscriptions();
    }

    static assetType = AssetTypes.SYSTEM;
}
