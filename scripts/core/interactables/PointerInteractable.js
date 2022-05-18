/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import States from '/scripts/core/enums/InteractableStates.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import Interactable from '/scripts/core/interactables/Interactable.js';

class PointerInteractable extends Interactable {
    constructor(threeObj, actionFunc, canDisableOrbit, canDisplayPointer, specificOption, draggableActionFunc) {
        super(threeObj);
        this._actionFunc = actionFunc;
        this._canDisableOrbit = global.deviceType != "XR" && canDisableOrbit != false;
        this.canDisplayPointer = global.deviceType == "XR" && canDisplayPointer != false;
        this.specificOption = specificOption;
        this._draggableActionFunc = draggableActionFunc;
    }

    isOnlyGroup() {
        return this._actionFunc == null && !this.canDisplayPointer && !this._canDisableOrbit;
    }

    isDraggable() {
        return this._draggableActionFunc != null;
    }

    _determineAndSetState() {
        if(this._selectedOwners.size > 0) {
            this.setState(States.SELECTED);
        } else if(this._hoveredOwners.size > 0) {
            this.setState(States.HOVERED);
        } else {
            this.setState(States.IDLE);
        }
    }

    addHoveredBy(owner, closestPoint) {
        if(this._hoveredOwners.has(owner)) {
            return;
        } else if(this._selectedOwners.has(owner)) {
            this.triggerAction(closestPoint);
        }
        this._hoveredOwners.add(owner);
        if(this._selectedOwners.size == 0) {
            this.setState(States.HOVERED);
        }
    }

    removeHoveredBy(owner) {
        this._hoveredOwners.delete(owner);
        this._determineAndSetState();
    }

    addSelectedBy(owner, closestPoint) {
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
        if(this._canDisableOrbit) SessionHandler.disableOrbit();
        if(this._draggableActionFunc) this._draggableActionFunc(closestPoint);
    }

    removeSelectedBy(owner) {
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
        if(this._canDisableOrbit) SessionHandler.enableOrbit();
    }

    triggerAction(closestPoint) {
        if(this._actionFunc != null) {
            this._actionFunc(closestPoint);
        }
    }

    triggerDraggableAction(closestPoint) {
        if(this._draggableActionFunc != null) {
            this._draggableActionFunc(closestPoint);
        }
    }

    updateAction(newActionFunc) {
        this._actionFunc = newActionFunc;
    }

    static emptyGroup() {
        return new PointerInteractable(null, null, false, false);
    }

    static createDraggable(threeObj, actionFunc, draggableActionFunc) {
        return new PointerInteractable(threeObj, actionFunc, true, true, null, draggableActionFunc);
    }
}

export default PointerInteractable;
