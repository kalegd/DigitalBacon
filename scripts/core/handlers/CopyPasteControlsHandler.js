/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import UserController from '/scripts/core/assets/UserController.js';
import Hands from '/scripts/core/enums/Hands.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

const MODES = ['translate', 'rotate', 'scale'];

class CopyPasteControlsHandler {
    constructor() {
        this._id = uuidv4();
        this._assetAlreadyPastedByTrigger = false;
        this._assetAlreadyPastedByGrip = false;
        this._copiedAsset;
        PubSub.subscribe(this._id, PubSubTopics.HAND_TOOLS_SWITCH, (handTool)=>{
            if(this._copiedAsset) this._clear();
            this._assetAlreadyPastedByTrigger = false;
            this._assetAlreadyPastedByGrip = false;
        });
    }

    copy(asset) {
        if(this._copiedAsset) this._clear();
        this._copiedAsset = asset;
        this._previewAsset = asset.preview();
        UserController.hands[Hands.LEFT].attach(this._previewAsset.getObject());
        UserController.hands[Hands.RIGHT].add(this._previewAsset.getObject());
    }

    _paste() {
        let clonedAsset = this._previewAsset.clone(
            this._copiedAsset.visualEdit);
        this._assetAlreadyPastedByGrip = true;
    }

    checkPlacement(controller) {
        if(!this._copiedAsset) return;
        let raycaster = controller['raycaster'];
        raycaster.far = Infinity;
        let isPressed = controller['isPressed'];
        let intersections = raycaster.intersectObjects(ProjectHandler.getObjects(), true);
        if(this._assetAlreadyPastedByTrigger) {
            if(isPressed) return;
            this._assetAlreadyPastedByTrigger = false;
        }
        if(intersections.length > 0) {
            controller['closestPoint'] = intersections[0].point;
            if(isPressed && this._copiedAsset) {
                let clonedAsset = this._copiedAsset.clone();
                clonedAsset.place(intersections[0]);
                this._assetAlreadyPastedByTrigger = true;
            }
        }
    }

    checkGripPlacement(isControllerPressed) {
        if(!this._copiedAsset) return;
        if(isControllerPressed != this._assetAlreadyPastedByGrip) {
            if(isControllerPressed) this._paste();
            else this._assetAlreadyPastedByGrip = false;
        }
    }

    _clear() {
        this._previewAsset.removeFromScene();
        this._copiedAsset = null;
        this._previewAsset = null;
    }

    hasCopiedObject() {
        return this._copiedAsset;
    }

}

let copyPasteControlsHandler = new CopyPasteControlsHandler();
export default copyPasteControlsHandler;
