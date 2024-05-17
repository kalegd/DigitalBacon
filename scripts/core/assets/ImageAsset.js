/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class ImageAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
        let side = numberOr(params['side'], THREE.DoubleSide);
        if(side != THREE.DoubleSide) this.side = side;
        this._side = side;
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
        this._updateBVH();
    }

    _getDefaultName() {
        return LibraryHandler.getAssetName(this._assetId) || 'Image';
    }

    exportParams() {
        let params = super.exportParams();
        params['side'] = this._mesh.material.side;
        return params;
    }

    get side() { return this._mesh.material.side; }

    set side(side) {
        if(side == this._side) return;
        if(!this._materialAlreadyCloned) {
            this._mesh.material = this._mesh.material.clone();
            this._materialAlreadyCloned = true;
        }
        this._side = side;
        this._mesh.material.side = side;
        this._mesh.material.needsUpdate = true;
    }

    static assetType = AssetTypes.IMAGE;
}
