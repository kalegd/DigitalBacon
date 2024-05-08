/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { GripInteractableHandler, InteractionToolHandler } from '/scripts/DigitalBacon-UI.js';

class CopyPasteControlsHandler {
    constructor() {
        this._id = uuidv4();
        this._assetAlreadyPastedByGrip = {};
        this._copiedAssets = {};
        this._previewAssets = {};
        GripInteractableHandler.registerToolHandler(InteractionTools.COPY_PASTE,
            (controller) => this._toolHandler(controller));
        InteractionToolHandler.addUpdateListener(() => {
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
            this._previewAssets[ownerId].onRemoveFromProject();
        this._copiedAssets[ownerId] = asset;
        this._previewAssets[ownerId] = asset.editorHelper.preview();
        let previewObject = this._previewAssets[ownerId].object;
        asset.parent.object.add(previewObject);
        ProjectHandler.getAsset(ownerId).object.attach(previewObject);
    }

    _paste(ownerId) {
        let previewAsset = this._previewAssets[ownerId];
        let previewObject = previewAsset.object;
        previewAsset.parent.object.attach(previewObject);
        previewAsset.clone(this._copiedAssets[ownerId].visualEdit);
        ProjectHandler.getAsset(ownerId).object.attach(previewObject);
        this._assetAlreadyPastedByGrip[ownerId] = true;
    }

    _toolHandler(controller) {
        let ownerId = controller.owner.id;
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
            this._previewAssets[ownerId].onRemoveFromProject();
        }
        this._copiedAssets = {};
        this._previewAssets = {};
    }
}

let copyPasteControlsHandler = new CopyPasteControlsHandler();
export default copyPasteControlsHandler;
