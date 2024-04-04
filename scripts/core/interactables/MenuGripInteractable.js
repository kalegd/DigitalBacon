/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { vector3s, quaternion } from '/scripts/core/helpers/constants.js';
import { GripInteractable } from '/scripts/DigitalBacon-UI.js';
import * as THREE from 'three';

class MenuGripInteractable extends GripInteractable {
    constructor(object, border) {
        super(object);
        if(object) object.gripInteractable = this;
        this._border = border;
    }

    _createBoundingObject() {
        this._boundingPlane = new THREE.Plane();
    }

    _getBoundingObject() {
        this._object.getWorldPosition(vector3s[0]);
        this._object.getWorldQuaternion(quaternion);
        vector3s[1].set(0,0,1).applyQuaternion(quaternion);
        this._boundingPlane.setFromNormalAndCoplanarPoint(vector3s[1],
            vector3s[0]);
        return this._boundingPlane;
    }

    _displayBoundingObject() {
        this._object.add(this._border);
    }

    _hideBoundingObject() {
        this._object.remove(this._border);
    }

    intersectsSphere(sphere) {
        let boundingPlane = this._getBoundingObject();
        let intersects;
        if(boundingPlane) {
            //We already have object's world position in vector3s[0]
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
}

export default MenuGripInteractable;
