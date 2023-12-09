/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { vector3s, quaternion } from '/scripts/core/helpers/constants.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import * as THREE from 'three';

class MenuGripInteractable extends GripInteractable {
    constructor(threeObj, border) {
        super(threeObj);
        if(threeObj) threeObj.gripInteractable = this;
        this._border = border;
    }

    _createBoundingObject() {
        this._boundingPlane = new THREE.Plane();
    }

    _getBoundingObject() {
        this._threeObj.getWorldPosition(vector3s[0]);
        this._threeObj.getWorldQuaternion(quaternion);
        vector3s[1].set(0,0,1).applyQuaternion(quaternion);
        this._boundingPlane.setFromNormalAndCoplanarPoint(vector3s[1],
            vector3s[0]);
        return this._boundingPlane;
    }

    _displayBoundingObject() {
        this._threeObj.add(this._border);
    }

    _hideBoundingObject() {
        this._threeObj.remove(this._border);
    }

    intersectsSphere(sphere) {
        let boundingPlane = this._getBoundingObject();
        let intersects;
        if(boundingPlane) {
            //We already have threeObj's world position in vector3s[0]
            intersects = sphere.intersectsPlane(boundingPlane)
                && sphere.distanceToPoint(vector3s[0]) < 0.45;
        } else {
            intersects = false;
        }
        return intersects;
    }

    // Assumes intersectsSphere(sphere) is called first so we don't update the
    // bounding plane by calling _getBoundingObject()
    distanceToSphere(sphere) {
        return this._boundingPlane.distanceToPoint(sphere.center);
    }

    static emptyGroup() {
        return new MenuGripInteractable();
    }
}

export default MenuGripInteractable;
