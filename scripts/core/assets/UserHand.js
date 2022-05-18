/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Hands from '/scripts/core/enums/Hands.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import { Vector3 } from 'three';

export default class UserHand {
    constructor(hand) {
        if(!hand in Hands) {
            throw new Error("constructor for UserXRInputSource must be LEFT or RIGHT");
        } else if(global.deviceType != "XR") {
            throw new Error("UserXRInputSource is for XR only");
        }
        this._hand = hand;
        this._isGripPressed = false;
        this._vector3 = new Vector3();

        this._setup();
        //Register as grabber in GrabInteractionHandler
    }

    _setup(hand) {
        this._controller = InputHandler.getXRController(this._hand, 'grip');
        this._controllerModel = InputHandler.getXRControllerModel(this._hand);
        this._cursor = PointerInteractableHandler.createXRCursor(this._hand);
    }

    getWorldPosition() {
        this._controller.getWorldPosition(this._vector3);
        return this._vector3;
    }

    add(threeObj) {
        this._controller.add(threeObj);
    }

    attach(threeObj) {
        this._controller.attach(threeObj);
    }

    remove(threeObj) {
        if(threeObj.parent == this._controller) {
            global.scene.attach(threeObj);
        }
    }

    addToScene(scene) {
        this._controller.add(this._controllerModel);
        global.scene.add(this._cursor);
    }

    removeFromScene() {
        this._controller.remove(this._controllerModel);
        global.scene.remove(this._cursor);
    }

    update(timeDelta) {

    }

}
