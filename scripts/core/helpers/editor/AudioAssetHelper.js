/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AudioAsset from '/scripts/core/assets/AudioAsset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { Colors, DISTANCE_MODEL_MAP } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import PlayableMediaAssetHelper from '/scripts/core/helpers/editor/PlayableMediaAssetHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

export default class AudioAssetHelper extends PlayableMediaAssetHelper {
    constructor(asset) {
        super(asset, PubSubTopics.AUDIO_UPDATED);
        this._createMesh();
    }

    _createMesh() {
        let geometry = new THREE.SphereGeometry(0.07);
        let material = new THREE.MeshLambertMaterial({ color: Colors.blue });
        this._mesh = new THREE.Mesh(geometry, material);
        if(this._asset.visualEdit) this._object.add(this._mesh);
    }

    updateVisualEdit(isVisualEdit) {
        if(isVisualEdit) {
            this._object.add(this._mesh);
        } else {
            this._object.remove(this._mesh);
            fullDispose(this._mesh);
        }
        super.updateVisualEdit(isVisualEdit);
    }

    static fields = [
        this.commonFields.visualEdit,
        { "parameter": "previewMedia", "name": "Preview Audio",
            "suppressMenuFocusEvent": true, "type": CheckboxInput},
        this.commonFields.autoplay,
        { "parameter": "coneInnerAngle", "name": "Cone Inner Angle", "min": 0,
            "max": 360, "type": NumberInput },
        { "parameter": "coneOuterAngle", "name": "Cone Outer Angle", "min": 0,
            "max": 360, "type": NumberInput },
        { "parameter": "coneOuterGain", "name": "Cone Outer Gain", "min": 0,
            "max": 1, "type": NumberInput },
        { "parameter": "distanceModel", "name": "Distance Model",
            "map": DISTANCE_MODEL_MAP, "type": EnumInput },
        this.commonFields.loop,
        { "parameter": "maxDistance", "name": "Max Rolloff Distance",
            "min": 0.01, "type": NumberInput },
        { "parameter": "refDistance", "name": "Min Rolloff Distance", "min": 0,
            "type": NumberInput },
        { "parameter": "rolloffFactor", "name": "Rolloff Factor", "min": 0,
            "type": NumberInput },
        { "parameter": "volume", "name": "Volume", "min": 0,
            "type": NumberInput },
        this.commonFields.playTopic,
        this.commonFields.pauseTopic,
        this.commonFields.stopTopic,
        this.commonFields.parentId,
        this.commonFields.position,
        this.commonFields.rotation,
        this.commonFields.scale,
    ];   
}

EditorHelperFactory.registerEditorHelper(AudioAssetHelper, AudioAsset);
