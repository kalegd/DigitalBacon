/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import * as THREE from 'three';

class Scene {
    constructor() {
        this._id = 'dc23454b-9d3c-4c94-b1d2-0448ec28415f';
        this._object = new THREE.Scene();
        this._gripInteractable = new GripInteractable();
        this._pointerInteractable = new PointerInteractable();
        global.scene = this._object;
    }
    
    getId() {
        return this._id;
    }

    getObject() {
        return this._object;
    }

    getGripInteractable() {
        return this._gripInteractable;
    }

    getPointerInteractable() {
        return this._pointerInteractable;
    }

    add(child, ignorePublish) {
        child.addTo(this, ignorePublish);
    }
}

let scene = new Scene();
export default scene;
