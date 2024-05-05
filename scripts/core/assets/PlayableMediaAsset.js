/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { concatenateArrayBuffers } from '/scripts/core/helpers/utils.module.js';
import PlayableMediaActions from '/scripts/core/enums/PlayableMediaActions.js';

export default class PlayableMediaEntity extends AssetEntity{
    constructor(params = {}) {
        super(params);
        this._autoplay = params['autoplay'] || false;
        this._loop = params['loop'] || false;
        this.playTopic = params['playTopic'] || '';
        this.pauseTopic = params['pauseTopic'] || '';
        this.stopTopic = params['stopTopic'] || '';
    }

    _getDefaultName() {
        return LibraryHandler.getAssetName(this._assetId);
    }

    exportParams() {
        let params = super.exportParams();
        params['autoplay'] = this._autoplay;
        params['loop'] = this._loop;
        params['pauseTopic'] = this._pauseTopic;
        params['playTopic'] = this._playTopic;
        params['stopTopic'] = this._stopTopic;
        return params;
    }

    get media() { return this._media; }
    get autoplay() { return this._autoplay; }
    get loop() { return this._loop; }
    get playTopic() { return this._playTopic; }
    get pauseTopic() { return this._pauseTopic; }
    get stopTopic() { return this._stopTopic; }
    get isPlaying() {
        console.error("get PlayableMediaAsset.isPlaying should be overridden");
    }
    get progress() {
        console.error("get PlayableMediaAsset.progress should be overridden");
    }

    set autoplay(autoplay) {
        this._autoplay = autoplay;
        if(!global.isEditor) this._media.autoplay = autoplay;
    }

    set loop(loop) { this._loop = loop; }
    set playTopic(playTopic) {
        if(this._playTopic) {
            PubSub.unsubscribe(this._id, this._playTopic);
        }
        this._playTopic = playTopic;
        if(this._playTopic) {
            PubSub.subscribe(this._id, this._playTopic, () => {
                if(!global.isEditor) this.play(null, true);
            });
        }
    }
    set pauseTopic(pauseTopic) {
        if(this._pauseTopic) {
            PubSub.unsubscribe(this._id, this._pauseTopic);
        }
        this._pauseTopic = pauseTopic;
        if(this._pauseTopic) {
            PubSub.subscribe(this._id, this._pauseTopic, () => {
                if(!global.isEditor) this.pause(null, true);
            });
        }
    }
    set progress(progress) {
        console.error("set PlayableMediaAsset.progress should be overridden");
    }
    set stopTopic(stopTopic) {
        if(this._stopTopic) {
            PubSub.unsubscribe(this._id, this._stopTopic);
        }
        this._stopTopic = stopTopic;
        if(this._stopTopic) {
            PubSub.subscribe(this._id, this._stopTopic, () => {
                if(!global.isEditor) this.stop(true);
            });
        }
    }

    publishPartyMessage(action, position, peer) {
        let type = new Uint8Array([action]);
        let message;
        if(position) {
            message = concatenateArrayBuffers(type, position);
        } else {
            message = type;
        }
        if(peer) {
            PartyHandler.publishInternalBufferMessage(this._idBytes, message, 
                false, peer);
        } else {
            PartyHandler.publishInternalBufferMessage(this._idBytes, message);
        }
    }

    play(position, ignorePublish) {
        this.progress = position;
        this._media.play();
        if(ignorePublish) return;
        position = new Float64Array([this.progress]);
        this.publishPartyMessage(PlayableMediaActions.PLAY, position);
    }

    pause(position, ignorePublish) {
        this._media.pause();
        this.progress = position;
        if(ignorePublish) return;
        position = new Float64Array([this.progress]);
        this.publishPartyMessage(PlayableMediaActions.PAUSE, position);
    }

    stop(ignorePublish) {
        this._media.pause();
        this.progress = 0;
        if(ignorePublish) return;
        this.publishPartyMessage(PlayableMediaActions.STOP);
    }

    _addPartySubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PEER_READY, (message) => {
            this._onPeerReady(message.peer);
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            this._onPartyStarted(PartyHandler.isHost());
        });
        PartyHandler.addInternalBufferMessageHandler(this._id, (p, m) => {
            let type = new Uint8Array(m, 0, 1);
            if(type[0] == PlayableMediaActions.PLAY) {
                let message = new Float64Array(m.slice(1));
                this.play(message[0], true);
            } else if(type[0] == PlayableMediaActions.PAUSE) {
                let message = new Float64Array(m.slice(1));
                this.pause(message[0], true);
            } else if(type[0] == PlayableMediaActions.STOP) {
                this.stop(true);
            }
        });
    }

    _onPeerReady(peer) {
        if(!PartyHandler.isHost()) return;
        let topic = (this.isPlaying) ? PlayableMediaActions.PLAY
            : PlayableMediaActions.PAUSE;
        let position = new Float64Array([this.progress]);
        this.publishPartyMessage(topic, position, peer);
    }

    _onPartyStarted(isHost) {
        if(isHost) return;
        this.stop(true);
    }

    onRemoveFromProject() {
        this.stop(true);
        super.onRemoveFromProject();
    }
}
