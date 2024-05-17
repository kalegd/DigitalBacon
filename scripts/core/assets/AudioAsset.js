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

    get audio() { return this._media; }
    get coneInnerAngle() { return this._coneInnerAngle; }
    get coneOuterAngle() { return this._coneOuterAngle; }
    get coneOuterGain() { return this._coneOuterGain; }
    get distanceModel() { return this._distanceModel; }
    get isPlaying() { return this._media.isPlaying; }
    get loop() { return super.loop; }
    get maxDistance() { return this._maxDistance; }
    get progress() {
        if(this._media.isPlaying) {
            this._media.pause();//pause() update audio._progress
            this._media.play();
        }
        return this._media._progress;
    }
    get refDistance() { return this._refDistance; }
    get rolloffFactor() { return this._rolloffFactor; }
    get volume() { return this._volume; }

    set coneInnerAngle(coneInnerAngle) {
        this._coneInnerAngle = coneInnerAngle;
        this._media.setDirectionalCone(coneInnerAngle, this._coneOuterAngle,
            this._coneOuterGain);
    }

    set coneOuterAngle(coneOuterAngle) {
        this._coneOuterAngle = coneOuterAngle;
        this._media.setDirectionalCone(this._coneInnerAngle, coneOuterAngle,
            this._coneOuterGain);
    }

    set coneOuterGain(coneOuterGain) {
        this._coneOuterGain = coneOuterGain;
        this._media.setDirectionalCone(this._coneInnerAngle,
            this._coneOuterAngle, coneOuterGain);
    }

    set distanceModel(distanceModel) {
        this._distanceModel = distanceModel;
        this._media.setDistanceModel(distanceModel);
    }

    set loop(loop) {
        super.loop = loop;
        this._media.setLoop(loop);
    }

    set maxDistance(maxDistance) {
        this._maxDistance = maxDistance;
        this._media.setMaxDistance(maxDistance);
    }

    set progress(position) {
        if(position != null) {
            this._media._progress = position || 0;
        }
    }

    set refDistance(refDistance) {
        this._refDistance = refDistance;
        this._media.setRefDistance(refDistance);
    }

    set rolloffFactor(rolloffFactor) {
        this._rolloffFactor = rolloffFactor;
        this._media.setRolloffFactor(rolloffFactor);
    }

    set volume(volume) {
        this._volume = volume;
        this._media.setVolume(volume);
    }

    play(position, ignorePublish) {
        if(this._media.isPlaying) this._media.pause();
        super.play(position, ignorePublish);
    }

    static assetType = AssetTypes.AUDIO;
}
