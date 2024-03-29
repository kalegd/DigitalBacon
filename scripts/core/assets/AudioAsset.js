/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PlayableMediaAsset from '/scripts/core/assets/PlayableMediaAsset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
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
        this._media = new THREE.PositionalAudio(AudioHandler.getListener());
        if(!global.isEditor) this._media.autoplay = this._autoplay;
        this._media.autoplay = this._autoplay;
        this._media.setDirectionalCone(this._coneInnerAngle,
            this._coneOuterAngle, this._coneOuterGain);
        this._media.setDistanceModel(this._distanceModel);
        this._media.setLoop(this._loop);
        this._media.setMaxDistance(this._maxDistance);
        this._media.setRefDistance(this._refDistance);
        this._media.setRolloffFactor(this._rolloffFactor);
        this._media.setVolume(this._volume);
        this._media.setBuffer(audioBuffer);
        this._object.add(this._media);
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
        return this._media;
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
        this._media.setDirectionalCone(coneInnerAngle, this._coneOuterAngle,
            this._coneOuterGain);
    }

    setConeOuterAngle(coneOuterAngle) {
        this._coneOuterAngle = coneOuterAngle;
        this._media.setDirectionalCone(this._coneInnerAngle, coneOuterAngle,
            this._coneOuterGain);
    }

    setConeOuterGain(coneOuterGain) {
        this._coneOuterGain = coneOuterGain;
        this._media.setDirectionalCone(this._coneInnerAngle,
            this._coneOuterAngle, coneOuterGain);
    }

    setDistanceModel(distanceModel) {
        this._distanceModel = distanceModel;
        this._media.setDistanceModel(distanceModel);
    }

    setLoop(loop) {
        super.setLoop(loop);
        this._media.setLoop(loop);
    }

    setMaxDistance(maxDistance) {
        this._maxDistance = maxDistance;
        this._media.setMaxDistance(maxDistance);
    }

    setRefDistance(refDistance) {
        this._refDistance = refDistance;
        this._media.setRefDistance(refDistance);
    }

    setRolloffFactor(rolloffFactor) {
        this._rolloffFactor = rolloffFactor;
        this._media.setRolloffFactor(rolloffFactor);
    }

    setVolume(volume) {
        this._volume = volume;
        this._media.setVolume(volume);
    }

    _addPartySubscriptions() {
        super._addPartySubscriptions();
    }

    isPlaying() {
        if(this._media.isPlaying) {
            this._media.pause();//pause() update audio._progress
            this._media.play();
        }
        return this._media.isPlaying;
    }

    getProgress() {
        return this._media._progress;
    }

    setProgress(position) {
        if(position != null) {
            this._media._progress = position || 0;
        }
    }

    static assetType = AssetTypes.AUDIO;
}
