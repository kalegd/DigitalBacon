/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Materials } from '/scripts/core/helpers/constants.js';

export default class Shape extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._material = params['material'];
    }

    _updateGeometry() {
        console.error("Shape._updateGeometry() should be overridden");
    }

    _getMaterial() {
        let materialAsset = ProjectHandler.getAsset(this._material);
        if(materialAsset) {
            return materialAsset.material;
        } else {
            return Materials.defaultMeshMaterial;
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['material'] = this._material;
        return params;
    }

    get material() { return this._material; }
    get mesh() { return this._mesh; }

    set material(newValue) {
        this._material = newValue;
        let oldMaterial = this._mesh.material;
        let material = this._getMaterial();
        this._mesh.material = material;
        oldMaterial.dispose();
    }

    static assetType = AssetTypes.SHAPE;
}
