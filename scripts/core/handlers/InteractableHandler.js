/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class InteractableHandler {
    constructor() {
        this._id = uuidv4();
        this._interactables = new Set();
        this._hoveredInteractables = {};
        this._selectedInteractables = {};
        this._toolInteractables = {};
        this._toolInteractables[HandTools.EDIT] = new Set();
        this._toolInteractables[HandTools.COPY_PASTE] = new Set();
        this._toolInteractables[HandTools.DELETE] = new Set();
        this._handTool = HandTools.EDIT;
        this._addInteractable = this.addInteractable;
        this._addInteractables = this.addInteractables;
        this._removeInteractable = this.removeInteractable;
        this._removeInteractables = this.removeInteractables;
        this.addInteractable = () => {};
        this.addInteractables = () => {};
        this.removeInteractable = () => {};
        this.removeInteractables = () => {};
    }

    init() {
        if(global.deviceType == "XR") {
            this.update = this._updateForXREdit;
            this._setupXRSubscription();
        } else if(global.deviceType == "POINTER") {
            this.update = this._updateForPointer;
        } else if(global.deviceType == "MOBILE") {
            this.update = this._updateForMobile;
        }
        this.addInteractable = this._addInteractable;
        this.addInteractables = this._addInteractables;
        this.removeInteractable = this._removeInteractable;
        this.removeInteractables = this._removeInteractables;
    }

    addInteractable(interactable, tool) {
        if(!tool) {
            this._interactables.add(interactable);
        } else {
            this._toolInteractables[tool].add(interactable);
        }
    }

    addInteractables(interactables, tool) {
        if(!tool) {
            interactables.forEach((interactable) => {
                this._interactables.add(interactable);
            });
        } else {
            interactables.forEach((interactable) => {
                this._toolInteractables[tool].add(interactable);
            });
        }
    }

    removeInteractable(interactable, tool) {
        if(!tool) {
            this._interactables.delete(interactable);
            interactable.reset();
        } else {
            this._toolInteractables[tool].delete(interactable);
            interactable.reset();
        }
    }

    removeInteractables(interactables, tool) {
        if(!tool) {
            interactables.forEach((interactable) => {
                this._interactables.delete(interactable);
                interactable.reset();
            });
        } else {
            interactables.forEach((interactable) => {
                this._toolInteractables[tool].delete(interactable);
                interactable.reset();
            });
        }
    }

    reset() {
        this._interactables.forEach(interactable => { interactable.reset(); });
        this._interactables = new Set();
        this._hoveredInteractables = {};
        this._selectedInteractables = {};
    }

}
