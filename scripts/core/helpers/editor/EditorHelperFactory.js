/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class EditorHelperFactory {
    constructor() {
        this._editorHelperClassMap = {};
    }

    registerEditorHelper(editorHelper, assetClass) {
        this._editorHelperClassMap[assetClass] = editorHelper;
    }

    addEditorHelperTo(asset) {
        if(asset.editorHelper) return;
        let assetClass = asset.constructor;
        while(!this._editorHelperClassMap[assetClass]) {
            assetClass = Object.getPrototypeOf(assetClass);
        }
        let EditorHelper = this._editorHelperClassMap[assetClass];
        asset.editorHelper = new EditorHelper(asset);
    }
}

let editorHelperFactory = new EditorHelperFactory();
export default editorHelperFactory;
