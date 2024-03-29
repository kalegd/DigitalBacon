/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import States from '/scripts/core/enums/InteractableStates.js';
import ToolHandler from '/scripts/core/handlers/ToolHandler.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import Box3Helper from '/scripts/core/helpers/Box3Helper.js';
import Interactable from '/scripts/core/interactables/Interactable.js';
import * as THREE from 'three';

class GripInteractable extends Interactable {
    constructor(threeObj) {
        super(threeObj);
        if(threeObj) threeObj.gripInteractable = this;
        this._createBoundingObject();
    }

    addAction(selectedAction, releasedAction, tool) {
        if(selectedAction && typeof selectedAction == 'object') {
            if(!this._actions[selectedAction.id]) {
                this._toolCounts[selectedAction.tool || 'none']++;
            }
            this._actions[selectedAction.id] = selectedAction;
            this._actionsLength = Object.keys(this._actions).length;
            return selectedAction;
        }
        let action = super.addAction(tool);
        action['selectedAction'] = selectedAction;
        action['releasedAction'] = releasedAction;
        action['selectedBy'] = new Set();
        action['type'] = 'GRIP';
        return action;
    }

    isOnlyGroup() {
        return !this.supportsTool();
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
        this._triggerSelected(owner);
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
    }

    removeSelectedBy(owner) {
        this._triggerReleased(owner);
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
    }
    
    _triggerSelected(owner) {
        let tool = ToolHandler.getTool();
        let currentIds = Object.keys(this._actions);
        for(let id of currentIds) {
            let action = this._actions[id];
            if(!action) continue;
            if(!action.tool || action.tool == tool) {
                if(action.selectedAction) action.selectedAction(owner);
                action.selectedBy.add(owner);
            }
        }
    }

    _triggerReleased(owner) {
        let currentIds = Object.keys(this._actions);
        for(let id of currentIds) {
            let action = this._actions[id];
            if(!action) continue;
            if(action.selectedBy.has(owner)) {
                if(action.releasedAction) action.releasedAction(owner);
                action.selectedBy.delete(owner);
            }
        }
    }

    static emptyGroup() {
        return new GripInteractable();
    }
}

export default GripInteractable;
