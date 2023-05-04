/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';

export default class GLTFAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addGLTF(params);
    }

    static assetType = AssetTypes.MODEL;
}
