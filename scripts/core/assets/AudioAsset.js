/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PlayableMediaAsset from '/scripts/core/assets/PlayableMediaAsset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class AudioAsset extends PlayableMediaAsset {
    constructor(params = {}) {
        super(params);
        this._coneInnerAngle = numberOr(params['coneInner'], 360);
        this._coneOuterAngle = params['coneOuterAngle'] || 0;
        this._coneOuterGain = params['coneOuterGain'] || 0;
        this._distanceModel = params['distanceModel'] || 'inverse';
        this._maxDistance = numberOr(params['maxDistance'], 100);
        this._refDistance = numberOr(params['refDistance'], 1);
        this._rolloffFactor = numberOr(params['rolloffFactor'], 1);
        this._volume = numberOr(params['volume'], 1);
        this._createMesh(params['assetId']);
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
        super._setMedia(this._audio);
    }

    _getDefaultName() {
        return super._getDefaultName() || 'Audio';
    }

    exportParams() {
        let params = super.exportParams();
        params['coneInnerAngle'] = this._coneInnerAngle;
        params['coneOuterAngle'] = this._coneOuterAngle;
        params['coneOuterGain'] = this._coneOuterGain;
        params['distanceModel'] = this._distanceModel;
        params['maxDistance'] = this._maxDistance;
        params['refDistance'] = this._refDistance;
        params['rolloffFactor'] = this._rolloffFactor;
        params['volume'] = this._volume;
        return params;
    }

    getAudio() {
        return this._audio;
    }

    getConeInnerAngle() {
        return this._coneInnerAngle;
    }

    getConeOuterAngle() {
        return this._coneOuterAngle;
    }

    getConeOuterGain() {
        return this._coneOuterGain;
    }

    getDistanceModel() {
        return this._distanceModel;
    }

    getMaxDistance() {
        return this._maxDistance;
    }

    getRefDistance() {
        return this._refDistance;
    }

    getRolloffFactor() {
        return this._rolloffFactor;
    }

    getVolume() {
        return this._volume;
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
        super.setLoop(loop);
        this._audio.setLoop(loop);
    }

    setMaxDistance(maxDistance) {
        this._maxDistance = maxDistance;
        this._audio.setMaxDistance(maxDistance);
    }

    setRefDistance(refDistance) {
        this._refDistance = refDistance;
        this._audio.setRefDistance(refDistance);
    }

    setRolloffFactor(rolloffFactor) {
        this._rolloffFactor = rolloffFactor;
        this._audio.setRolloffFactor(rolloffFactor);
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
        super.play();
        if(ignorePublish) return;
        position = new Float64Array([this._audio._progress]);
        this.publishMessage(PLAY, position, "");
    }

    pause(position, ignorePublish) {
        super.pause();
        if(position != null) {
            this._audio._progress = position || 0;
        }
        if(ignorePublish) return;
        position = new Float64Array([this._audio._progress]);
        this.publishMessage(PAUSE, position, "");
    }

    stop(ignorePublish) {
        this._audio.stop();
        if(ignorePublish) return;
        super.stop();
    }

    _addPartySubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.PEER_READY, (message) => {
            this._onPeerReady(message.peer);
        });
    }

    _onPeerReady(peer) {
        if(!PartyHandler.isHost()) return;
        let topic = PAUSE;
        if(this._audio.isPlaying) {
            this._audio.pause();//pause() update audio._progress
            this._audio.play();
            topic = PLAY;
        }
        let position = new Float64Array([this._audio._progress]);
        this.publishMessage(topic, position, peer);
    }

    static assetType = AssetTypes.AUDIO;
}
