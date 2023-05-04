/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import * as THREE from 'three';

export default class ClampedTexturePlane extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
        this._doubleSided = !(params.doubleSided == false);
        if(!this._doubleSided) this._updateDoubleSided(false);
        this._transparent = params['transparent'] != false;
        if(!this._transparent) this._updateTransparent(false);
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
    }

    _updateTransparent(isTransparent) {
        if(!this._materialAlreadyCloned) {
            this._mesh.material = this._mesh.material.clone();
            this._materialAlreadyCloned = true;
        }
        this._mesh.material.transparent = isTransparent;
        this._transparent = isTransparent;
     }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addImage(params);
    }

    exportParams() {
        let params = super.exportParams();
        params['doubleSided'] = this._mesh.material.side == THREE.DoubleSide;
        params['transparent'] = this._transparent;
        return params;
    }

    getDoubleSided() {
        return this._mesh.material.side == THREE.DoubleSide;
    }

    setDoubleSided(doubleSided) {
        if(doubleSided == this._doubleSided) return;
        if(!this._materialAlreadyCloned) {
            this._mesh.material = this._mesh.material.clone();
            this._materialAlreadyCloned = true;
        }
        this._mesh.material.side = (doubleSided)
            ? THREE.DoubleSide
            : THREE.FrontSide;
        this._doubleSided = doubleSided;
    }

    static assetType = AssetTypes.IMAGE;
}
