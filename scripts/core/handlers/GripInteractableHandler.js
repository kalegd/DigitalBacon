/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Scene from '/scripts/core/assets/Scene.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import XRInputDeviceTypes from '/scripts/core/enums/XRInputDeviceTypes.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import InteractableHandler from '/scripts/core/handlers/InteractableHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import * as THREE from 'three';

class GripInteractableHandler extends InteractableHandler {
    constructor() {
        super();
    }

    init() {
        super.init();
        this._sphere = new THREE.Sphere();
        this._box3 = new THREE.Box3();
        this.addInteractable(Scene.getGripInteractable());
    }

    _getBoundingSphere(xrController) {
        if(!xrController) return null;
        let modelObject = xrController.getModelObject()
            || xrController.getObject();
        this._box3.setFromObject(modelObject).getBoundingSphere(this._sphere);
        return this._sphere;
    }

    _scopeInteractables(controller, interactables) {
        let boundingSphere = controller['boundingSphere'];
        if(boundingSphere == null) return;
        for(let interactable of interactables) {
            if(interactable.children.size != 0)
                this._scopeInteractables(controller, interactable.children);
            let threeObj = interactable.getThreeObj();
            if(threeObj == null || interactable.isOnlyGroup()
                    || !interactable.supportsOwner(controller.option)) {
                continue;
            }
            let intersects = interactable.intersectsSphere(boundingSphere);
            if(intersects) {
                let distance = interactable.distanceToSphere(boundingSphere);
                if(distance < controller['closestPointDistance']) {
                    controller['closestPointDistance'] = distance;
                    controller['closestInteractable'] = interactable;
                }
            }
        }
    }

    _updateInteractables(controller) {
        let option = controller.option;
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

    _updateForXR() {
        if(!global.sessionActive) return;
        for(let handedness in Handedness) {
            let controllerExists = false;
            for(let type of ['getController', 'getHand']) {
                let xrDevice = global.userController[type](handedness);
                if(!xrDevice) continue;
                let active = xrDevice.isInScene();
                if(active) {
                    if(type == 'getController') {
                        controllerExists = true;
                    } else if(controllerExists) {
                        active = false;
                    }
                }
                let controller = {
                    option: xrDevice.getId(),
                    boundingSphere: (active)
                        ? this._getBoundingSphere(xrDevice)
                        : null,
                    isPressed: (active) ? xrDevice.isButtonPressed(1) : false,
                    closestPointDistance: Number.MAX_SAFE_INTEGER,
                };
                let skipUpdate = false;
                if(this._toolHandlers[this._tool]) {
                    skipUpdate = this._toolHandlers[this._tool](controller);
                }
                if(!skipUpdate) this._updateInteractables(controller);
            }
        }
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
