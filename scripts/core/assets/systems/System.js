/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Asset from '/scripts/core/assets/Asset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class System extends Asset {
    constructor(params = {}) {
        super(params);
        this._disabled = params['disabled'] || false;
        this._addSystemSubscriptions();
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
    }

    _listenForComponentAttached(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ATTACHED + ':'
                + componentAssetId, (message) => { handler(message); });
    }

    _listenForComponentDetached(componentAssetId, handler) {
        if(!componentAssetId || !handler) return;
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DETACHED + ':'
                + componentAssetId, (message) => { handler(message); });
    }

    _onPeerReady() {}
    _onPartyStarted() {}
    _onPartyEnded() {}

    getDescription() {
        console.error("System.getDescription() should be overridden");
        return '';
    }

    getDisabled() {
        return this._disabled;
    }

    setDisabled(disabled) {
        this._disabled = disabled;
    }

    needsUpdates() {
        return false;
    }

    static assetType = AssetTypes.SYSTEM;
}
