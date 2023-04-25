/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Materials } from '/scripts/core/helpers/constants.js';
import PrimitiveMeshHelper from '/scripts/core/helpers/editor/PrimitiveMeshHelper.js';

export default class PrimitiveMesh extends Asset {
    constructor(params = {}) {
        super(params);
        this._material = params['material'];
    }

    _createEditorHelper() {
        this._editorHelper = new PrimitiveMeshHelper(this);
    }

    _updateGeometry() {
        console.error("PrimitiveMesh._updateGeometry() should be overridden");
    }

    _getMaterial() {
        let material = MaterialsHandler.getMaterial(this._material);
        if(material) {
            return material.getMaterial();
        } else {
            return Materials.defaultMeshMaterial;
        }
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addShape(params, this._assetId);
    }

    exportParams() {
        let params = super.exportParams();
        params['material'] = this._material;
        return params;
    }

    getMaterial() {
        return this._material;
    }

    setMaterial(newValue) {
        let wasTranslucent = this._mesh.material.userData['oldMaterial'];
        if(wasTranslucent) this.returnTransparency();

        this._material = newValue;
        let oldMaterial = this._mesh.material;
        let material = this._getMaterial();
        this._mesh.material = material;
        oldMaterial.dispose();

        if(wasTranslucent) this.makeTranslucent();
    }
}
