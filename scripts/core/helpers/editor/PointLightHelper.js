/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PointLight from '/scripts/core/assets/primitives/PointLight.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import LightHelper from '/scripts/core/helpers/editor/LightHelper.js';
import * as THREE from 'three';

const { NumberField } = LightHelper.FieldTypes;

export default class PointLightHelper extends LightHelper {
    constructor(asset) {
        super(asset);
        this._createMesh();
    }

    _createMesh() {
        let geometry = new THREE.SphereGeometry(0.07);
        let material = new THREE.MeshBasicMaterial({ color: Colors.yellow });
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
        "color",
        "intensity",
        { "parameter": "distance", "name": "Distance", "min": 0,
            "type": NumberField },
        { "parameter": "decay", "name": "Decay", "min": 0,
            "type": NumberField },
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(PointLightHelper, PointLight);
