/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import States from '/scripts/core/enums/InteractableStates.js';
import Hands from '/scripts/core/enums/Hands.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import CopyPasteControlsHandler from '/scripts/core/handlers/CopyPasteControlsHandler.js';
import InteractableHandler from '/scripts/core/handlers/InteractableHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import * as THREE from 'three';

class GripInteractableHandler extends InteractableHandler {
    constructor() {
        super();
    }

    init() {
        super.init();
        this._spheres = {};
        this._spheres[Hands.LEFT] = new THREE.Sphere();
        this._spheres[Hands.RIGHT] = new THREE.Sphere();
        this._box3 = new THREE.Box3();
    }

    _setupXRSubscription() {
        PubSub.subscribe(this._id, PubSubTopics.HAND_TOOLS_SWITCH, (tool) => {
            let options = [Hands.LEFT, Hands.RIGHT];
            for(let option of options) {
                let hoveredInteractable = this._hoveredInteractables[option];
                if(hoveredInteractable && 
                        !this._interactables.has(hoveredInteractable)) {
                    this._hoveredInteractables[option].removeHoveredBy(option);
                    delete this._hoveredInteractables[option];
                }
                let selectedInteractable = this._selectedInteractables[option];
                if(selectedInteractable &&
                        !this._interactables.has(selectedInteractable)) {
                    this._selectedInteractables[option]
                        .removeSelectedBy(option);
                    delete this._selectedInteractables[option];
                }
            }
            if(tool == HandTools.COPY_PASTE) {
                this.update = this._updateForXRCopyPaste;
            } else {
                this.update = this._updateForXREdit;
            }
        });
    }

    _getBoundingSphere(option) {
        if(option == Hands.LEFT || option == Hands.RIGHT) {
            let xrController = InputHandler.getXRController(option, "grip");
            this._box3.setFromObject(xrController)
                .getBoundingSphere(this._spheres[option]);
            return this._spheres[option];
        }
    }

    _isControllerPressed(option) {
        if(option == Hands.LEFT || option == Hands.RIGHT) {
            let gamepad = InputHandler.getXRGamepad(option);
            return gamepad != null
                && gamepad.buttons.length > 1
                && gamepad.buttons[1].pressed;
        }
    }

    _scopeInteractables(controller, interactables) {
        let boundingSphere = controller['boundingSphere'];
        if(boundingSphere == null) return;
        for(let interactable of interactables) {
            if(interactable.specificOption &&
                interactable.specificOption != controller.option) continue;
            let threeObj = interactable.getThreeObj();
            if(threeObj == null) {
                if(interactable.children.size != 0)
                    this._scopeInteractables(controller, interactable.children);
                continue;
            }
            if(!interactable.supportsOwner(controller.owner)) continue;
            let intersects = interactable.intersectsSphere(boundingSphere);
            if(intersects) {
                if(interactable.children.size != 0) {
                    this._scopeInteractables(controller, Array.from(interactable.children));
                }
                let distance = interactable.distanceToSphere(boundingSphere);
                if(!interactable.isOnlyGroup() && distance < controller['closestPointDistance']) {
                    controller['closestPointDistance'] = distance;
                    controller['closestInteractable'] = interactable;
                }
            }
        }
    }

    _updateInteractables(controllers) {
        for(let option in controllers) {
            let controller = controllers[option];
            let isPressed = controller['isPressed'];
            this._scopeInteractables(controller, this._interactables);
            let hoveredInteractable = this._hoveredInteractables[option];
            let selectedInteractable = this._selectedInteractables[option];
            let closestInteractable = controller['closestInteractable'];
            if(closestInteractable) {
                if(isPressed) {
                    if(!selectedInteractable 
                            && hoveredInteractable == closestInteractable)
                    {
                        closestInteractable.addSelectedBy(option);
                        this._selectedInteractables[option] = closestInteractable;
                        closestInteractable.removeHoveredBy(option);
                        this._hoveredInteractables[option] = null;
                    }
                } else {
                    if(hoveredInteractable != closestInteractable) {
                        if(hoveredInteractable) {
                            hoveredInteractable.removeHoveredBy(option);
                        }
                        closestInteractable.addHoveredBy(option);
                        this._hoveredInteractables[option] = closestInteractable;
                    }
                    if(selectedInteractable) {
                        selectedInteractable.removeSelectedBy(option);
                        this._selectedInteractables[option] = null;
                    }
                }
            } else if(!isPressed) {
                if(hoveredInteractable) {
                    hoveredInteractable.removeHoveredBy(option);
                    this._hoveredInteractables[option] = null;
                }
                if(selectedInteractable) {
                    selectedInteractable.removeSelectedBy(option);
                    this._selectedInteractables[option] = null;
                }
            }
        }
    }

    _updateForXRCopyPaste() {
        if(!global.sessionActive) return;
        let controllers = {};
        controllers[Hands.LEFT] = {
            option: Hands.LEFT,
            boundingSphere: this._getBoundingSphere(Hands.LEFT),
            isPressed: this._isControllerPressed(Hands.LEFT),
            closestPointDistance: Number.MAX_SAFE_INTEGER,
        };

        if(CopyPasteControlsHandler.hasCopiedObject()) {
            CopyPasteControlsHandler.checkGripPlacement(
                this._isControllerPressed(Hands.RIGHT));
        } else {
            controllers[Hands.RIGHT] = {
                option: Hands.RIGHT,
                boundingSphere: this._getBoundingSphere(Hands.RIGHT),
                isPressed: this._isControllerPressed(Hands.RIGHT),
                closestPointDistance: Number.MAX_SAFE_INTEGER,
            };
        }

        this._updateInteractables(controllers);
    }

    _updateForXREdit() {
        if(!global.sessionActive) return;
        let controllers = {};
        let controllerOptions = [Hands.LEFT, Hands.RIGHT];
        for(let i = 0; i < controllerOptions.length; i++) {
            let option = controllerOptions[i];
            controllers[option] = {
                option: option,
                boundingSphere: this._getBoundingSphere(option),
                isPressed: this._isControllerPressed(option),
                closestPointDistance: Number.MAX_SAFE_INTEGER,
            };
        }

        this._updateInteractables(controllers);
    }

    _updateForPointer() {
        return;
    }

    _updateForMobile() {
        return;
    }

}

let gripInteractableHandler = new GripInteractableHandler();
export default gripInteractableHandler;
