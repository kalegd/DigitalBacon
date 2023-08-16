/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

class CopyPasteControlsHandler {
    constructor() {
        this._id = uuidv4();
        this._assetAlreadyPastedByTrigger = false;
        this._assetAlreadyPastedByGrip = false;
        this._copiedAssets = {};
        this._previewAssets = {};
        GripInteractableHandler.registerToolHandler(HandTools.COPY_PASTE,
            (controller) => { return this._toolHandler(controller); });
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (handTool)=>{
            if(Object.keys(this._copiedAssets).length > 0) this._clear();
            this._assetAlreadyPastedByTrigger = false;
            this._assetAlreadyPastedByGrip = false;
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(Object.keys(this._copiedAssets).length > 0) this._clear();
            this._assetAlreadyPastedByTrigger = false;
            this._assetAlreadyPastedByGrip = false;
        });
    }

    copy(hand, asset) {
        if(this._previewAssets[hand])
            this._previewAssets[hand].removeFromScene();
        this._copiedAssets[hand] = asset;
        this._previewAssets[hand] = asset.editorHelper.preview();
        global.userController.getController(hand).getObject().attach(
            this._previewAssets[hand].getObject());
    }

    _paste(hand) {
        this._previewAssets[hand].clone(
            this._copiedAssets[hand].visualEdit);
        this._assetAlreadyPastedByGrip = true;
    }

    _toolHandler(controller) {
        let hand = controller.option;
        if(!this._copiedAssets[hand]) return false;
        if(controller.isPressed != this._assetAlreadyPastedByGrip) {
            if(controller.isPressed) this._paste(hand);
            else this._assetAlreadyPastedByGrip = false;
        }
        return true;
    }

    _clear() {
        for(let hand in this._previewAssets) {
            this._previewAssets[hand].removeFromScene();
        }
        this._copiedAssets = {};
        this._previewAssets = {};
    }
}

let copyPasteControlsHandler = new CopyPasteControlsHandler();
export default copyPasteControlsHandler;
