/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import * as THREE from 'three';

export default class ModelAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
        this._updateBVH();
        this._configureMesh();
    }

    _configureMesh() {
        if(this._mesh) this._mesh.renderOrder = this._renderOrder;
        this._mesh.traverse((node) => {
            if(node instanceof THREE.Mesh) node.renderOrder =this._renderOrder;;
        });
    }

    _getDefaultName() {
        return LibraryHandler.getAssetName(this._assetId)
            || super._getDefaultName();
    }

    static assetType = AssetTypes.MODEL;
}
