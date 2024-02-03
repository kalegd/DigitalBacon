/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '../../../scripts/core/enums/InteractableStates.js';
import ToolHandler from '../../../scripts/core/handlers/ToolHandler.js';
import { uuidv4 } from '../../../scripts/core/helpers/utils.module.js';

class Interactable {
    constructor(threeObj) {
        this._threeObj = threeObj;
        this._state = States.IDLE;
        this.children = new Set();
        this._hoveredOwners = new Set();
        this._selectedOwners = new Set();
        this._actions = {};
        this._actionsLength = 0;
        this._toolCounts = {};
    }

    addAction(tool) {
        let id = uuidv4();
        let action = {
            id: id,
            tool: tool,
        };
        this._actions[id] = action;
        this._actionsLength = Object.keys(this._actions).length;
        tool = tool || 'none';
        if(!this._toolCounts[tool]) this._toolCounts[tool] = 0;
        this._toolCounts[tool]++;
        return action;
    }

    removeAction(id) {
        let action = this._actions[id];
        delete this._actions[id];
        this._actionsLength = Object.keys(this._actions).length;
        if(action) this._toolCounts[action.tool || 'none']--;
        return action;
    }

    getActionsLength() {
        return this._actionsLength;
    }

    supportsTool() {
        let tool = ToolHandler.getTool();
        return this._toolCounts['none'] || this._toolCounts[tool];
    }

    isOnlyGroup() {
        console.error("Interactable.isOnlyGroup() should be overridden");
        return;
    }

    getThreeObj() {
        return this._threeObj;
    }

    getState() {
        return this._state;
    }

    setState(newState) {
        if(this._state != newState) {
            this._state = newState;
            if(this._threeObj.states && newState in this._threeObj.states) {
                this._threeObj.setState(newState);
            }
        }
    }

    addHoveredBy(_owner) {
        console.error("Interactable.addHoveredBy(owner) should be overridden");
    }

    removeHoveredBy(_owner) {
        console.error("Interactable.removeHoveredBy(owner) should be overridden");
    }

    addSelectedBy(_owner) {
        console.error("Interactable.addSelectedBy(owner) should be overridden");
    }

    removeSelectedBy(_owner) {
        console.error("Interactable.removeSelectedBy(owner) should be overridden");
    }

    reset() {
        this._hoveredOwners.clear();
        this._selectedOwners.clear();
        this.setState(States.IDLE);
        this.children.forEach((interactable) => {
            interactable.reset();
        });
    }

    addChild(interactable) {
        if(interactable.parent == this) return;
        if(interactable.parent) interactable.parent.removeChild(interactable);
        this.children.add(interactable);
        interactable.parent = this;
    }

    addChildren(interactables) {
        interactables.forEach((interactable) => {
            this.addChild(interactable);
        });
    }

    removeChild(interactable) {
        this.children.delete(interactable);
        interactable.parent = null;
    }

    removeChildren(interactables) {
        interactables.forEach((interactable) => {
            this.removeChild(interactable);
        });
    }
}

export default Interactable;
