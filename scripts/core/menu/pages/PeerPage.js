/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Party from '/scripts/core/clients/Party.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Styles } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const options = [
    { "title": "Make Host", "handler": "_handleMakeHost" },
    { "title": "Kick Out", "handler": "_handleKickOut" },
];

class PeerPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        this._titleBlock = new Text('', Styles.title);
        this.add(this._titleBlock);

        let columnBlock = new Div({
            height: 0.2,
            width: 0.45,
        });
        for(let option of options) {
            let button = createWideButton(option.title);
            button.margin = 0.004;
            button.onClickAndTouch = () => this[option.handler]();
            columnBlock.add(button);
        }
        this.add(columnBlock);
    }

    _handleMakeHost() {
        if(this._designateHostCallback)
            this._designateHostCallback(this._peer.id);
        PartyHandler.setIsHost(false);
        Party.designateHost(this._peer.id);
        this._controller.back();
    }

    _handleKickOut() {
        Party.bootPeer(this._peer.id);
        this._controller.back();
    }

    setContent(peer, designateHostCallback) {
        let username = stringWithMaxLength(peer.username || '...', 12);
        this._titleBlock.text = username;
        this._peer = peer;
        this._designateHostCallback = designateHostCallback;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PARTY_ENDED, () => {
            this._controller.back();
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_DISCONNECTED, (message) =>{
            if(this._peer == message.peer) this._controller.back();
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_USERNAME_UPDATED,
            (message) => {
                if(this._peer == message.peer) this.setContent(this._peer);
            }
        );
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.PARTY_ENDED);
        PubSub.unsubscribe(this._id, PubSubTopics.PEER_DISCONNECTED);
        PubSub.unsubscribe(this._id, PubSubTopics.PEER_USERNAME_UPDATED);
    }

    back() {
        this._removeSubscriptions();
        super.back();
    }

    _onAdded() {
        this._addSubscriptions();
        super._onAdded();
    }
}

export default PeerPage;
