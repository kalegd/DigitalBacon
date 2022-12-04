/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Entity from '/scripts/core/assets/Entity.js';
import Hands from '/scripts/core/enums/Hands.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import * as THREE from 'three';

export default class PeerHand extends Entity {
    constructor(hand) {
        super();
        if(!hand in Hands) {
            throw new Error("constructor for PeerHand must be LEFT or RIGHT");
        }
        this._hand = hand;
        this._isGripPressed = false;
        this._vector3 = new THREE.Vector3();

        this._setup();
    }

    _setup() {
        let geometry = new THREE.SphereGeometry(0.05);
        let material = new THREE.MeshLambertMaterial({ color: 0xC68863 });
        this._mesh = new THREE.Mesh(geometry, material);
        this._object.add(this._mesh);
    }

    add(threeObj) {
        this._object.add(threeObj);
    }

    attach(threeObj) {
        this._object.attach(threeObj);
    }

    remove(threeObj) {
        if(threeObj.parent == this._object) {
            global.scene.attach(threeObj);
        }
    }
}
