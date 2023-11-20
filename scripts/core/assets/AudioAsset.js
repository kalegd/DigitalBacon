/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import UserController from '/scripts/core/assets/UserController.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { concatenateArrayBuffers, numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const PLAY_TOPIC_PREFIX = 'PLAY_AUDIO_ASSET:';
const PLAY = 0;
const PAUSE = 1;
const STOP = 2

export default class AudioAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._autoplay = params['autoplay'] || false;
        this._coneInnerAngle = numberOr(params['coneInner'], 360);
        this._coneOuterAngle = params['coneOuterAngle'] || 0;
        this._coneOuterGain = params['coneOuterGain'] || 0;
        this._distanceModel = params['distanceModel'] || 'inverse';
        this._loop = params['loop'] || false;
        this._maxDistance = numberOr(params['maxDistance'], 100);
        this._refDistance = numberOr(params['refDistance'], 1);
        this._rolloffFactor = numberOr(params['rolloffFactor'], 1);
        this._volume = numberOr(params['volume'], 1);
        this._createMesh(params['assetId']);
        this.setPlayTopic(params['playTopic'] || '');
        this.setPauseTopic(params['pauseTopic'] || '');
        this.setStopTopic(params['stopTopic'] || '');
        if(!global.isEditor) this._addPartySubscriptions();
    }

    _createMesh(assetId) {
        let audioBuffer = LibraryHandler.getBuffer(assetId);
        this._audio = new THREE.PositionalAudio(AudioHandler.getListener());
        if(!global.isEditor) this._audio.autoplay = this._autoplay;
        this._audio.autoplay = this._autoplay;
        this._audio.setDirectionalCone(this._coneInnerAngle,
            this._coneOuterAngle, this._coneOuterGain);
        this._audio.setDistanceModel(this._distanceModel);
        this._audio.setLoop(this._loop);
        this._audio.setMaxDistance(this._maxDistance);
        this._audio.setRefDistance(this._refDistance);
        this._audio.setRolloffFactor(this._rolloffFactor);
        this._audio.setVolume(this._volume);
        this._audio.setBuffer(audioBuffer);
        this._object.add(this._audio);
    }

    _getDefaultName() {
        return LibraryHandler.getAssetName(this._assetId)
            || 'Audio';
    }

    exportParams() {
        let params = super.exportParams();
        params['autoplay'] = this._autoplay;
        params['coneInnerAngle'] = this._coneInnerAngle;
        params['coneOuterAngle'] = this._coneOuterAngle;
        params['coneOuterGain'] = this._coneOuterGain;
        params['distanceModel'] = this._distanceModel;
        params['loop'] = this._loop;
        params['maxDistance'] = this._maxDistance;
        params['pauseTopic'] = this._pauseTopic;
        params['playTopic'] = this._playTopic;
        params['refDistance'] = this._refDistance;
        params['rolloffFactor'] = this._rolloffFactor;
        params['stopTopic'] = this._stopTopic;
        params['volume'] = this._volume;
        return params;
    }

    getAudio() {
        return this._audio;
    }

    getAutoplay(autoplay) {
        return this._autoplay;
    }

    getConeInnerAngle(coneInnerAngle) {
        return this._coneInnerAngle;
    }

    getConeOuterAngle(coneOuterAngle) {
        return this._coneOuterAngle;
    }

    getConeOuterGain(coneOuterGain) {
        return this._coneOuterGain;
    }

    getDistanceModel(distanceModel) {
        return this._distanceModel;
    }

    getLoop(loop) {
        return this._loop;
    }

    getMaxDistance(maxDistance) {
        return this._maxDistance;
    }

    getPlayTopic(playTopic) {
        return this._playTopic;
    }

    getPauseTopic(pauseTopic) {
        return this._pauseTopic;
    }

    getRefDistance(refDistance) {
        return this._refDistance;
    }

    getRolloffFactor(rolloffFactor) {
        return this._rolloffFactor;
    }

    getStopTopic(stopTopic) {
        return this._stopTopic;
    }

    getVolume(volume) {
        return this._volume;
    }

    setAutoplay(autoplay) {
        this._autoplay = autoplay;
        if(!global.isEditor) this._audio.autoplay = autoplay;
    }

    setConeInnerAngle(coneInnerAngle) {
        this._coneInnerAngle = coneInnerAngle;
        this._audio.setDirectionalCone(coneInnerAngle, this._coneOuterAngle,
            this._coneOuterGain);
    }

    setConeOuterAngle(coneOuterAngle) {
        this._coneOuterAngle = coneOuterAngle;
        this._audio.setDirectionalCone(this._coneInnerAngle, coneOuterAngle,
            this._coneOuterGain);
    }

    setConeOuterGain(coneOuterGain) {
        this._coneOuterGain = coneOuterGain;
        this._audio.setDirectionalCone(this._coneInnerAngle,
            this._coneOuterAngle, coneOuterGain);
    }

    setDistanceModel(distanceModel) {
        this._distanceModel = distanceModel;
        this._audio.setDistanceModel(distanceModel);
    }

    setLoop(loop) {
        this._loop = loop;
        this._audio.setLoop(loop);
    }

    setMaxDistance(maxDistance) {
        this._maxDistance = maxDistance;
        this._audio.setMaxDistance(maxDistance);
    }

    setPlayTopic(playTopic) {
        if(this._playTopic) {
            PubSub.unsubscribe(this._id, this._playTopic);
        }
        this._playTopic = playTopic;
        if(this._playTopic) {
            PubSub.subscribe(this._id, this._playTopic, (message) => {
                if(!global.isEditor) this._audio.play();
            });
        }
    }

    setPauseTopic(pauseTopic) {
        if(this._pauseTopic) {
            PubSub.unsubscribe(this._id, this._pauseTopic);
        }
        this._pauseTopic = pauseTopic;
        if(this._pauseTopic) {
            PubSub.subscribe(this._id, this._pauseTopic, (message) => {
                if(!global.isEditor) this._audio.pause();
            });
        }
    }

    setRefDistance(refDistance) {
        this._refDistance = refDistance;
        this._audio.setRefDistance(refDistance);
    }

    setRolloffFactor(rolloffFactor) {
        this._rolloffFactor = rolloffFactor;
        this._audio.setRolloffFactor(rolloffFactor);
    }

    setStopTopic(stopTopic) {
        if(this._stopTopic) {
            PubSub.unsubscribe(this._id, this._stopTopic);
        }
        this._stopTopic = stopTopic;
        if(this._stopTopic) {
            PubSub.subscribe(this._id, this._stopTopic, (message) => {
                if(!global.isEditor) this._audio.stop();
            });
        }
    }

    setVolume(volume) {
        this._volume = volume;
        this._audio.setVolume(volume);
    }

    play(position, ignorePublish) {
        this._audio.pause();//pause() update audio._progress
        if(position != null) {
            this._audio._progress = position || 0;
        }
        this._audio.play();
        if(ignorePublish) return;
        let type = new Uint8Array([PLAY]);
        position = new Float64Array([this._audio._progress]);
        let message = concatenateArrayBuffers(type, position);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message);
    }

    pause(position, ignorePublish) {
        this._audio.pause();
        if(position != null) {
            this._audio._progress = position || 0;
        }
        if(ignorePublish) return;
        let type = new Uint8Array([PAUSE]);
        position = new Float64Array([this._audio._progress]);
        let message = concatenateArrayBuffers(type, position);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message);
    }

    stop(ignorePublish) {
        this._audio.stop();
        if(ignorePublish) return;
        let message = new Uint8Array([STOP]);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message);
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
            if(type[0] == PLAY) {
                let message = new Float64Array(m, 1, 1);
                this.play(message[0], true);
            } else if(type[0] == PAUSE) {
                let message = new Float64Array(m, 1, 1);
                this.pause(message[0], true);
            } else if(type[0] == STOP) {
                this.stop(true);
            }
        });
    }

    _onPeerReady(peer) {
        if(!PartyHandler.isHost()) return;
        if(!this._audio.isPlaying) return;
        this._audio.pause();//pause() update audio._progress
        this._audio.play();
        let type = new Uint8Array([PLAY]);
        let position = new Float64Array([this._audio._progress]);
        let message = concatenateArrayBuffers(type, position);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message, peer);
    }

    _onPartyStarted(isHost) {
        if(isHost) return;
        this._audio.stop();
    }

    static assetType = AssetTypes.AUDIO;
}
