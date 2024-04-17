/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import SpotLight from '/scripts/core/assets/primitives/SpotLight.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import LightHelper from '/scripts/core/helpers/editor/LightHelper.js';
//import CheckboxField from '/scripts/core/menu/input/CheckboxField.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import TextureField from '/scripts/core/menu/input/TextureField.js';
import * as THREE from 'three';

export default class SpotLightHelper extends LightHelper {
    constructor(asset) {
        super(asset);
        this._createMesh();
    }

    _createMesh() {
        let geometry = new THREE.ConeGeometry(0.07, 0.14, 8);
        geometry.translate(0, -0.07, 0);
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
        { "parameter": "visualEdit" },
        { "parameter": "color" },
        { "parameter": "intensity" },
        { "parameter": "angle", "name": "Angle", "min": 0, "max": 180,
            "type": NumberField },
        //{ "parameter": "castShadow", "name": "Cast Shadow",
        //    "type": CheckboxField },
        { "parameter": "distance", "name": "Distance", "min": 0,
            "type": NumberField },
        { "parameter": "decay", "name": "Decay", "min": 0,
            "type": NumberField },
        { "parameter": "penumbra", "name": "Penumbra", "min": 0, "max": 1,
            "type": NumberField },
        { "parameter": "map", "name": "Texture", "type": TextureField },
        { "parameter": "parentId" },
        { "parameter": "position" },
        { "parameter": "rotation" },
        { "parameter": "scale" },
    ];
}

EditorHelperFactory.registerEditorHelper(SpotLightHelper, SpotLight);
