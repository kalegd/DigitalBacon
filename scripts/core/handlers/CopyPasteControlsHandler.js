/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

class CopyPasteControlsHandler {
    constructor() {
        this._id = uuidv4();
        this._assetAlreadyPastedByGrip = {};
        this._copiedAssets = {};
        this._previewAssets = {};
        GripInteractableHandler.registerToolHandler(HandTools.COPY_PASTE,
            (controller) => this._toolHandler(controller));
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, () => {
            if(Object.keys(this._copiedAssets).length > 0) this._clear();
            this._assetAlreadyPastedByGrip = {};
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, () => {
            if(Object.keys(this._copiedAssets).length > 0) this._clear();
            this._assetAlreadyPastedByGrip = {};
        });
    }

    copy(ownerId, asset) {
        if(this._previewAssets[ownerId])
            this._previewAssets[ownerId].removeFromScene();
        this._copiedAssets[ownerId] = asset;
        this._previewAssets[ownerId] = asset.editorHelper.preview();
        let previewObject = this._previewAssets[ownerId].getObject();
        asset.parent.getObject().add(previewObject);
        ProjectHandler.getAsset(ownerId).getObject().attach(previewObject);
    }

    _paste(ownerId) {
        let previewAsset = this._previewAssets[ownerId];
        let previewObject = previewAsset.getObject();
        previewAsset.parent.getObject().attach(previewObject);
        previewAsset.clone(this._copiedAssets[ownerId].visualEdit);
        ProjectHandler.getAsset(ownerId).getObject().attach(previewObject);
        this._assetAlreadyPastedByGrip[ownerId] = true;
    }

    _toolHandler(controller) {
        let ownerId = controller.option;
        if(!this._copiedAssets[ownerId]) return false;
        let alreadyPasted = Boolean(this._assetAlreadyPastedByGrip[ownerId]);
        if(controller.isPressed != alreadyPasted) {
            if(controller.isPressed) this._paste(ownerId);
            else this._assetAlreadyPastedByGrip[ownerId] = false;
        }
        return true;
    }

    _clear() {
        for(let ownerId in this._previewAssets) {
            this._previewAssets[ownerId].removeFromScene();
        }
        this._copiedAssets = {};
        this._previewAssets = {};
    }
}

let copyPasteControlsHandler = new CopyPasteControlsHandler();
export default copyPasteControlsHandler;
