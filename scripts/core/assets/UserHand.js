/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Hands from '/scripts/core/enums/Hands.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import { Euler, Quaternion, Vector3 } from 'three';

export default class UserHand {
    constructor(hand) {
        if(!hand in Hands) {
            throw new Error("constructor for UserXRInputSource must be LEFT or RIGHT");
        } else if(global.deviceType != "XR") {
            throw new Error("UserXRInputSource is for XR only");
        }
        this._hand = hand;
        this._vector3 = new Vector3();
        this._euler = new Euler();
        this._quaternion = new Quaternion();

        this._setup();
    }

    _setup() {
        this._controller = InputHandler.getXRController(this._hand, 'grip');
        this._controllerModel = InputHandler.getXRControllerModel(this._hand);
        this._cursor = PointerInteractableHandler.createXRCursor(this._hand);
    }

    isInScene() {
        return this._controller.parent != null;
    }

    getWorldPosition() {
        this._controller.getWorldPosition(this._vector3);
        return this._vector3;
    }

    getWorldRotation() {
        this._controller.getWorldQuaternion(this._quaternion);
        this._quaternion.normalize();
        this._euler.setFromQuaternion(this._quaternion);
        return this._euler;
    }

    getWorldQuaternion() {
        this._controller.getWorldQuaternion(this._quaternion);
        return this._quaternion;
    }

    add(threeObj) {
        this._controller.add(threeObj);
    }

    attach(threeObj) {
        this._controller.attach(threeObj);
    }

    hasChild(threeObj) {
        return threeObj.parent == this._controller;
    }

    remove(threeObj) {
        if(threeObj.parent == this._controller) {
            global.scene.attach(threeObj);
            return true;
        }
        return false;
    }

    addToScene(scene) {
        this._controller.add(this._controllerModel);
        global.scene.add(this._cursor);
    }

    removeFromScene() {
        this._controller.remove(this._controllerModel);
        global.scene.remove(this._cursor);
    }
}
