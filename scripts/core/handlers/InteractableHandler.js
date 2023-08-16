/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import MenuGripInteractable from '/scripts/core/interactables/MenuGripInteractable.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class InteractableHandler {
    constructor() {
        this._id = uuidv4();
        this._interactables = new Set();
        this._hoveredInteractables = {};
        this._selectedInteractables = {};
        this._tool = null;
        this._toolHandlers = {};
        this._addInteractable = this.addInteractable;
        this._addInteractables = this.addInteractables;
        this._removeInteractable = this.removeInteractable;
        this._removeInteractables = this.removeInteractables;
        this.addInteractable = () => {};
        this.addInteractables = () => {};
        this.removeInteractable = () => {};
        this.removeInteractables = () => {};
    }

    _setupXRSubscription() {
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (tool) => {
            this._tool = tool;
            for(let option in this._hoveredInteractables) {
                let interactable = this._hoveredInteractables[option];
                if(!interactable) return;
                if(interactable instanceof MenuGripInteractable) continue;
                interactable.removeHoveredBy(option);
                delete this._hoveredInteractables[option];
            }
            for(let option in this._selectedInteractables) {
                let interactable = this._selectedInteractables[option];
                if(!interactable) return;
                if(interactable instanceof MenuGripInteractable) continue;
                interactable.removeSelectedBy(option);
                delete this._selectedInteractables[option];
            }
        });
    }

    init() {
        if(global.deviceType == "XR") {
            this.update = this._updateForXR;
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

    registerToolHandler(tool, handler) {
        this._toolHandlers[tool] = handler;
    }

    addInteractable(interactable) {
        this._interactables.add(interactable);
    }

    addInteractables(interactables) {
        interactables.forEach((interactable) => {
            this._interactables.add(interactable);
        });
    }

    removeInteractable(interactable) {
        this._interactables.delete(interactable);
        interactable.reset();
    }

    removeInteractables(interactables) {
        interactables.forEach((interactable) => {
            this._interactables.delete(interactable);
            interactable.reset();
        });
    }

    reset() {
        this._interactables.forEach(interactable => { interactable.reset(); });
        this._interactables = new Set();
        this._hoveredInteractables = {};
        this._selectedInteractables = {};
    }

}
