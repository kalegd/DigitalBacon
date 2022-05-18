/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/core/enums/InteractableStates.js';

class Interactable {
    constructor(threeObj) {
        this._threeObj = threeObj;
        this._state = States.IDLE;
        this.children = new Set();
        this._hoveredOwners = new Set();
        this._selectedOwners = new Set();
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

    addHoveredBy(owner) {
        console.error("Interactable.addHoveredBy(owner) should be overridden");
    }

    removeHoveredBy(owner) {
        console.error("Interactable.removeHoveredBy(owner) should be overridden");
    }

    addSelectedBy(owner) {
        console.error("Interactable.addSelectedBy(owner) should be overridden");
    }

    removeSelectedBy(owner) {
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
