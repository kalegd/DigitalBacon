/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, AudioHandler, EditorHelpers, LibraryHandler, ProjectHandler, MenuInputs, isEditor, utils } = window.DigitalBacon;
const { CustomAsset } = Assets;
const { CustomAssetHelper, EditorHelperFactory } = EditorHelpers;
const { AudioInput, CheckboxInput, NumberInput } = MenuInputs;
const { numberOr } = utils;


import * as THREE from 'three';

export default class GlobalAudio extends CustomAsset {
    constructor(params = {}) {
        super(params);
        this._audio = params['audio'];
        this._autoplay = params['autoplay'] || false;
        this._loop = params['loop'] || false;
        this._volume = numberOr(params['volume'], 1);
        this._createAudio();
    }

    _createAudio(assetId) {
        let audioBuffer = LibraryHandler.getBuffer(this._audio);
        this._object = new THREE.Audio(AudioHandler.getListener());
        if(!isEditor) this._object.autoplay = this._autoplay;
        this._object.autoplay = this._autoplay;
        this._object.setLoop(this._loop);
        this._object.setVolume(this._volume);
        this._object.setBuffer(audioBuffer);
    }

    _getDefaultName() {
        return GlobalAudio.assetName;
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addNewAsset(this._assetId, params);
    }

    exportParams() {
        let params = super.exportParams();
        params['audio'] = this._audio;
        params['autoplay'] = this._autoplay;
        params['loop'] = this._loop;
        params['volume'] = this._volume;
        return params;
    }

    getAudio() {
        return this._audio;
    }

    getAutoplay() {
        return this._autoplay;
    }

    getLoop() {
        return this._loop;
    }

    getVolume() {
        return this._volume;
    }

    setAudio(audio) {
        let audioBuffer = LibraryHandler.getBuffer(audio);
        this._audio = audio;
        this._object.setBuffer(audioBuffer);
    }

    setAutoplay(autoplay) {
        this._autoplay = autoplay;
        if(!isEditor) this._object.autoplay = autoplay;
    }

    setLoop(loop) {
        this._loop = loop;
        this._object.setLoop(loop);
    }

    setVolume(volume) {
        this._volume = volume;
        this._object.setVolume(volume);
    }

    static assetId = '88533b7f-b525-433f-8512-75cb0794d3d9';
    static assetName = 'Global Audio';
}

ProjectHandler.registerAsset(GlobalAudio);

if(EditorHelpers) {
    class GlobalAudioHelper extends CustomAssetHelper {
        constructor(asset) {
            super(asset);
        }

        static fields = [
            { "parameter": "audio", "name": "Audio", "type": AudioInput },
            { "parameter": "autoplay", "name": "Auto Play",
                "suppressMenuFocusEvent": true, "type": CheckboxInput },
            { "parameter": "loop", "name": "Loop",
                "suppressMenuFocusEvent": true, "type": CheckboxInput },
            { "parameter": "volume", "name": "Volume", "min": 0,
                "type": NumberInput },
        ];
    }

    EditorHelperFactory.registerEditorHelper(GlobalAudioHelper,
        GlobalAudio);
}
