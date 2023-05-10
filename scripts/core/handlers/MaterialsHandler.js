/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import AssetsHandler from '/scripts/core/handlers/AssetsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';

const SHOULD_HAVE_REFACTORED_SOONER = {
    BASIC: '943b7a57-7e8f-4717-9bc6-0ba2637d9e3b',
    LAMBERT: '5169a83b-1e75-4cb1-8c33-c049726d97e4',
    NORMAL: '61262e1f-5495-4280-badc-b9e4599026f7',
    PHONG: 'c9cfa45a-99b4-4166-b252-1c68b52773b0',
    STANDARD: 'a6a1aa81-50a6-4773-aaf5-446d418c9817',
    TOON: 'be461019-0fc2-4c88-bee4-290ee3a585eb',
};

class MaterialsHandler extends AssetsHandler {
    constructor() {
        super(PubSubTopics.MATERIAL_ADDED, PubSubTopics.MATERIAL_DELETED);
    }

    addAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.addAsset(asset, ignoreUndoRedo, ignorePublish);
        if(asset.editorHelper) asset.editorHelper.undoDispose();
    }

    deleteAsset(asset, ignoreUndoRedo, ignorePublish) {
        super.deleteAsset(asset, ignoreUndoRedo, ignorePublish);
        asset.dispose();
        if(asset.editorHelper) asset.editorHelper.dispose();
    }

    load(assets, isDiff) {
        if(assets) this._handleOldVersion(assets);
        super.load(assets, isDiff);
    }

    _handleOldVersion(assets) {
        let usingOldVersion = false;
        for(let type in SHOULD_HAVE_REFACTORED_SOONER) {
            if(type in assets) {
                let id = SHOULD_HAVE_REFACTORED_SOONER[type];
                assets[id] = assets[type];
                delete assets[type];
                usingOldVersion = true;
            }
        }
        if(usingOldVersion) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: "The project's version is outdated and won't be supported starting in July. Please save a new copy of it",
            });
        }
    }
}

let materialsHandler = new MaterialsHandler();
export default materialsHandler;
