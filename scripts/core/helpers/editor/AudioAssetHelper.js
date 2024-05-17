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
import * as THREE from 'three';

const { EnumField, NumberField } = PlayableMediaAssetHelper.FieldTypes;

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
        "visualEdit",
        "previewMedia",
        "autoplay",
        { "parameter": "coneInnerAngle", "name": "Cone Inner Angle", "min": 0,
            "max": 360, "type": NumberField },
        { "parameter": "coneOuterAngle", "name": "Cone Outer Angle", "min": 0,
            "max": 360, "type": NumberField },
        { "parameter": "coneOuterGain", "name": "Cone Outer Gain", "min": 0,
            "max": 1, "type": NumberField },
        { "parameter": "distanceModel", "name": "Distance Model",
            "map": DISTANCE_MODEL_MAP, "type": EnumField },
        "loop",
        { "parameter": "maxDistance", "name": "Max Rolloff Distance",
            "min": 0.01, "type": NumberField },
        { "parameter": "refDistance", "name": "Min Rolloff Distance", "min": 0,
            "type": NumberField },
        { "parameter": "rolloffFactor", "name": "Rolloff Factor", "min": 0,
            "type": NumberField },
        { "parameter": "volume", "name": "Volume", "min": 0,
            "type": NumberField },
        "playTopic",
        "pauseTopic",
        "stopTopic",
        "parentId",
        "position",
        "rotation",
        "scale",
    ];   
}

EditorHelperFactory.registerEditorHelper(AudioAssetHelper, AudioAsset);
