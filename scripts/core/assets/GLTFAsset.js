/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import GLTFAssetHelper from '/scripts/core/helpers/editor/GLTFAssetHelper.js';

export default class GLTFAsset extends Asset {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
        if(params['isPreview']) this.makeTranslucent();
    }

    _createEditorHelper() {
        this._editorHelper = new GLTFAssetHelper(this);
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addGLTF(params);
    }
}
