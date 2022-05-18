/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import States from '/scripts/core/enums/InteractableStates.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import Box3Helper from '/scripts/core/helpers/Box3Helper.js';
import Interactable from '/scripts/core/interactables/Interactable.js';
import * as THREE from 'three';

class GripInteractable extends Interactable {
    constructor(threeObj, selectedFunc, releasedFunc, specificOption) {
        super(threeObj);
        this._selectedFunc = selectedFunc;
        this._releasedFunc = releasedFunc;
        this.specificOption = specificOption;
        this._createBoundingObject();
    }

    isOnlyGroup() {
        return this._selectedFunc == null && this._releasedFunc == null;
    }

    _createBoundingObject() {
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
    }

    _getBoundingObject() {
        this._boundingBox.setFromObject(this._threeObj);
        return this._boundingBox;
    }

    _displayBoundingObject() {
        global.scene.add(this._boundingBoxObj);
    }

    _hideBoundingObject() {
        global.scene.remove(this._boundingBoxObj);
    }

    intersectsSphere(sphere) {
        let boundingBox = this._getBoundingObject();
        let intersects;
        if(boundingBox) {
            intersects = sphere.intersectsBox(boundingBox);
        } else {
            intersects = false;
        }
        return intersects;
    }

    // Assumes intersectsSphere(sphere) is called first so we don't update the
    // bounding box by calling _getBoundingObject()
    distanceToSphere(sphere) {
        return sphere.distanceToPoint(this._boundingBox.getCenter(vector3s[0]));
    }

    _determineAndSetState() {
        if(this._selectedOwners.size > 0) {
            this.setState(States.SELECTED);
            if(this._hoveredOwners.size >= this._selectedOwners.size) {
                this._displayBoundingObject();
            } else {
                this._hideBoundingObject();
            }
        } else if(this._hoveredOwners.size > 0) {
            this.setState(States.HOVERED);
            this._displayBoundingObject();
        } else {
            this.setState(States.IDLE);
            this._hideBoundingObject();
        }
    }

    addHoveredBy(owner) {
        if(this._hoveredOwners.has(owner)) {
            return;
        }
        this._hoveredOwners.add(owner);
        if(this._selectedOwners.size == 0) {
            this.setState(States.HOVERED);
        }
        this._displayBoundingObject();
    }

    removeHoveredBy(owner) {
        this._hoveredOwners.delete(owner);
        this._determineAndSetState();
    }

    addSelectedBy(owner) {
        if(this._selectedFunc != null) {
            this._selectedFunc(owner);
        }
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
    }

    removeSelectedBy(owner) {
        if(this._releasedFunc != null) {
            this._releasedFunc(owner);
        }
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }

    updateAction(newActionFunc) {
        this._selectedFunc = newActionFunc;
    }

    static emptyGroup() {
        return new GripInteractable();
    }
}

export default GripInteractable;
