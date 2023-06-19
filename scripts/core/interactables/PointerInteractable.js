/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import States from '/scripts/core/enums/InteractableStates.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import Interactable from '/scripts/core/interactables/Interactable.js';

class PointerInteractable extends Interactable {
    constructor(threeObj, canDisableOrbit, specificOption) {
        super(threeObj);
        this._draggableActions = [];
        this._canDisableOrbit = global.deviceType != "XR" && canDisableOrbit;
        this.specificOption = specificOption;
    }

    addAction(action, draggableAction, maxDistance, tool, option) {
        if(action && typeof action == 'object') {
            this._actions.push(action);
            return action;
        }
        if(!maxDistance) maxDistance = Infinity;
        let id = uuidv4();
        action = {
            id: id,
            action: action,
            draggableAction: draggableAction,
            draggingOwners: new Set(),
            maxDistance: maxDistance,
            tool: tool,
            specificOption: option,
            type: 'POINTER',
        };
        this._actions.push(action);
        return action;
    }

    isOnlyGroup() {
        return this._threeObj && this._actions.length == 0
            && !this._canDisableOrbit;
    }

    isWithinReach(distance) {
        for(let action of this._actions) {
            if(action.maxDistance < distance) return false;
        }
        return true;
    }

    supportsOwner(owner) {
        //TODO: Should have a map that tracks how many actions for each tool as
        //      we add + remove actions so we can respond to this function call
        //      faster
        for(let action of this._actions) {
            if((!action.tool || action.tool == global.tool)
                && (!action.specificOption || action.specificOption == owner))
                return true;
        }
        return this._actions.length == 0;
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

    addHoveredBy(owner, closestPoint, distance) {
        if(this._hoveredOwners.has(owner)) {
            return;
        } else if(this._selectedOwners.has(owner)) {
            this.triggerActions(owner, closestPoint, distance);
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

    addSelectedBy(owner, closestPoint, distance) {
        this._selectedOwners.add(owner);
        this.setState(States.SELECTED);
        if(this._canDisableOrbit) SessionHandler.disableOrbit();
        this.triggerDraggableActions(owner, closestPoint, distance);
    }

    removeSelectedBy(owner) {
        if(!this._hoveredOwners.has(owner)) {
            this.releaseDraggedActions(owner);
        }
        this._selectedOwners.delete(owner);
        this._determineAndSetState();
        if(this._canDisableOrbit) SessionHandler.enableOrbit();
    }

    triggerActions(owner, closestPoint, distance) {
        for(let action of this._actions) {
            if(action.action && (!action.tool || action.tool == global.tool)
                && (!action.specificOption || action.specificOption == owner)
                && (action.maxDistance >= distance
                    || action.draggingOwners.has(owner)))
            {
                action.action(closestPoint);
            }
            if(action.draggingOwners.has(owner))
                action.draggingOwners.delete(owner);
        }
    }

    triggerDraggableActions(owner, closestPoint, distance) {
        for(let action of this._actions) {
            if(action.draggableAction
                && (!action.tool || action.tool == global.tool)
                && (!action.specificOption || action.specificOption == owner)
                && (action.draggingOwners.has(owner)
                    || action.maxDistance >= distance))
            {
                action.draggableAction(closestPoint);
                action.isDragging = true;
                if(!action.draggingOwners.has(owner))
                    action.draggingOwners.add(owner);
            }
        }
    }

    releaseDraggedActions(owner) {
        for(let action of this._actions) {
            if(action.draggingOwners.has(owner)) {
                if(action.action) action.action();
                action.draggingOwners.delete(owner);
            }
        }
    }

    static emptyGroup() {
        return new PointerInteractable();
    }

    static createDraggable(threeObj, actionFunc, draggableActionFunc) {
        let interactable = new PointerInteractable(threeObj, true, null);
        interactable.addAction(actionFunc, draggableActionFunc);
        return interactable;
    }
}

export default PointerInteractable;
