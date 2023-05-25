/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class AudioAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._autoplay = params['autoplay'] || false;
        this._coneInnerAngle = numberOr(params['coneInner'], 360);
        this._coneOuterAngle = params['coneOuterAngle'] || 0;
        this._coneOuterGain = params['coneOuterGain'] || 0;
        this._distanceModel = params['distanceModel'] || 'inverse';
        this._loop = params['loop'] || false;
        this._maxDistance = numberOr(params['maxDistance'], 10000);
        this._refDistance = numberOr(params['refDistance'], 1);
        this._rolloffFactor = numberOr(params['rolloffFactor'], 1);
        this._volume = numberOr(params['volume'], 1);
        this._createMesh(params['assetId']);
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

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addNewAsset(this._assetId, params);
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
        params['refDistance'] = this._refDistance;
        params['rolloffFactor'] = this._rolloffFactor;
        params['volume'] = this._volume;
        return params;
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

    getRefDistance(refDistance) {
        return this._refDistance;
    }

    getRolloffFactor(rolloffFactor) {
        return this._rolloffFactor;
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

    static assetType = AssetTypes.AUDIO;
}
