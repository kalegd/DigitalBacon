/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { quaternion, vector3s } from '/scripts/core/helpers/constants.js';
import { GripInteractable, PointerInteractable } from '/scripts/DigitalBacon-UI.js';
import * as THREE from 'three';

class Scene {
    constructor() {
        this._id = 'dc23454b-9d3c-4c94-b1d2-0448ec28415f';
        this._object = new THREE.Scene();
        this._gripInteractable = new GripInteractable(this._object);
        this._pointerInteractable = new PointerInteractable(this._object);
        this.children = new Set();
        global.scene = this._object;
    }
    
    getId() {
        return this._id;
    }

    getObject() {
        return this._object;
    }

    getName() {
        return 'Scene';
    }

    get gripInteractable() { return this._gripInteractable; }
    get pointerInteractable() { return this._pointerInteractable; }

    set gripInteractable(_) {}
    set pointerInteractable(_) {}

    getWorldPosition(vector3) {
        if(!vector3) vector3 = vector3s[0];
        this._object.getWorldPosition(vector3);
        return vector3;
    }

    getWorldQuaternion(quat) {
        if(!quat) quat = quaternion;
        this._object.getWorldQuaternion(quat);
        return quat;
    }

    getWorldScale(vector3) {
        if(!vector3) vector3 = vector3s[0];
        this._object.getWorldScale(vector3);
        return vector3;
    }

    add(child, ignorePublish) {
        child.addTo(this, ignorePublish);
    }

    attach(child, ignorePublish) {
        child.attachTo(this, ignorePublish);
    }
}

let scene = new Scene();
export default scene;
