/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EulerInput from '/scripts/core/menu/input/EulerInput.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';
import * as THREE from 'three';

const FIELDS = [
    { "name": "Visually Edit", "type": CheckboxInput },
    { "name": "Position", "objParam": "position", "type": Vector3Input },
    { "name": "Rotation", "objParam": "rotation", "type": EulerInput },
    { "name": "Scale", "objParam": "scale", "type": Vector3Input },
];

export default class GLTFAsset extends Asset {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
    }

    place(intersection) {
        //TODO: Depenetrate from the face using normal and bounding box
        super.place(intersection);
    }

    clone(enableInteractablesOverride) {
        let params = this._fetchCloneParams(enableInteractablesOverride);
        return ProjectHandler.addGLTF(params);
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }
}
