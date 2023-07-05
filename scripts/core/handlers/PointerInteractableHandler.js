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
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

class PointerInteractableHandler extends InteractableHandler {
    constructor() {
        super();
        this._wasPressed = {};
    }

    init() {
        super.init();
        this._cursors = {};
    }

    _setupXRSubscription() {
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (tool) => {
            if(tool == HandTools.EDIT) {
                this.update = this._updateForXREdit;
            } else if(tool == HandTools.COPY_PASTE) {
                this.update = this._updateForXRCopyPaste;
            } else if(tool == HandTools.DELETE) {
                this.update = this._updateForXRDelete;
            } else {
                this.update = this._updateForXR;
            }
        });
    }

    createXRCursor(hand) {
        if(this._cursors[hand]) return this._cursors[hand];
        let canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(32, 32, 29, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.fill();
        let spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            depthTest: false,
            sizeAttenuation: false,
        });
        for(let h in Hands) {
            let cursor = new THREE.Sprite(spriteMaterial);
            cursor.scale.set(0.015,0.015,0.015);
            cursor.visible = false;
            cursor.renderOrder = Infinity;
            this._cursors[h] = cursor;
        }
        return this._cursors[hand];
    }

    _getRaycaster(option) {
        if(option == Hands.LEFT || option == Hands.RIGHT) {
            let position = new THREE.Vector3();
            let direction = new THREE.Vector3();
            let xrController = InputHandler.getXRController(option,
                "targetRay");
            xrController.getWorldPosition(position);
            xrController.getWorldDirection(direction).negate().normalize();
            return new THREE.Raycaster(position, direction, 0.01, 50);
        } else if(option == "POINTER") {
            let position = InputHandler.getPointerPosition();
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(position, global.camera);
            return raycaster;
        } else if(option == "MOBILE") {
            let position = InputHandler.getPointerPosition();
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(position, global.camera);
            return raycaster;
        }
    }

    _isControllerPressed(option) {
        if(option == Hands.LEFT || option == Hands.RIGHT) {
            let gamepad = InputHandler.getXRGamepad(option);
            return gamepad != null && gamepad.buttons[0].pressed;
        } else if(option == "POINTER") {
            return InputHandler.isPointerPressed();
        } else if(option == "MOBILE") {
            return InputHandler.isScreenTouched();
        }
    }

    _squashInteractables(option, interactables, objects) {
        for(let interactable of interactables) {
            if(!interactable.supportsOwner(option)) continue;
            let object = interactable.getThreeObj();
            if(object) objects.push(object);
            if(interactable.children.size != 0) {
                this._squashInteractables(option, interactable.children,
                    objects);
            }
        }
    }

    _getObjectInteractable(object) {
        while(object != null) {
            if(object.pointerInteractable) return object.pointerInteractable;
            object = object.parent;
        }
    }

    _raycastInteractables(controller, interactables) {
        let raycaster = controller['raycaster'];
        if(!raycaster) return;
        raycaster.firstHitOnly = true;
        let objects = [];
        this._squashInteractables(controller.option, interactables, objects);
        let intersections = raycaster.intersectObjects(objects);
        //console.log(intersections);
        for(let intersection of intersections) {
            let interactable = this._getObjectInteractable(intersection.object);
            if(!interactable) return;
            let distance = intersection.distance;
            let userDistance = distance;
            if(distance < controller['closestPointDistance']) {
                //TODO: interactables that aren't within reach probably
                //      don't need to be checked again for a while. We
                //      should add a number attribute like skipFrames that
                //      lets us know how many frames to skip checking for
                if(global.deviceType != 'XR') {
                    global.cameraFocus.getWorldPosition(vector3s[0]);
                    userDistance = intersection.point
                        .distanceTo(vector3s[0]);
                }   
                if(!interactable.isWithinReach(userDistance)) continue;
                controller['closestPointDistance'] = distance;
                controller['closestPoint'] = intersection.point;
                controller['closestInteractable'] = interactable;
                controller['userDistance'] = userDistance;
            }
        }
        return;
    }

    _updateInteractables(controllers) {
        for(let option in controllers) {
            let controller = controllers[option];
            let isPressed = controller['isPressed'];
            let hoveredInteractable = this._hoveredInteractables[option];
            let selectedInteractable = this._selectedInteractables[option];
            let closestInteractable = controller['closestInteractable'];
            let userDistance = controller['userDistance'];
            if(closestInteractable && !closestInteractable.isOnlyGroup()) {
                if(isPressed) {
                    if(selectedInteractable) {
                        if(selectedInteractable == closestInteractable) {
                            selectedInteractable.triggerDraggableActions(option,
                                controller['closestPoint'], userDistance);
                        }
                    } else if(hoveredInteractable == closestInteractable) {
                        closestInteractable.addSelectedBy(option,
                            controller['closestPoint'], userDistance);
                        this._selectedInteractables[option] = closestInteractable;
                        closestInteractable.removeHoveredBy(option);
                        this._hoveredInteractables[option] = null;
                    }
                } else {
                    if(hoveredInteractable != closestInteractable) {
                        if(hoveredInteractable) {
                            hoveredInteractable.removeHoveredBy(option);
                        }
                        closestInteractable.addHoveredBy(option,
                            controller['closestPoint'], userDistance);
                        this._hoveredInteractables[option] =closestInteractable;
                        //I can probably remove the below 2 lines
                    //} else if(selectedInteractable) {
                    //    selectedInteractable.releaseDraggedActions();
                    }
                    if(selectedInteractable) {
                        selectedInteractable.removeSelectedBy(option);
                        this._selectedInteractables[option] = null;
                    }
                }
            } else if(!isPressed) {
                if(this._wasPressed[option] && !hoveredInteractable
                        && !selectedInteractable) {
                    PubSub.publish(this._id, PubSubTopics.EMPTY_CLICK);
                }
                if(selectedInteractable) {
                    selectedInteractable.removeSelectedBy(option);
                    this._selectedInteractables[option] = null;
                }
                if(hoveredInteractable) {
                    hoveredInteractable.removeHoveredBy(option);
                    this._hoveredInteractables[option] = null;
                }
            }
            this._wasPressed[option] = isPressed;
        }
    }

    _updateInteractablesMobile(controllers) {
        for(let option in controllers) {
            let controller = controllers[option];
            let isPressed = controller['isPressed'];
            let selectedInteractable = this._selectedInteractables[option];
            let userDistance = controller['userDistance'];
            if(this._mobileWasTouched) {
                if(!selectedInteractable) {
                    this._mobileWasTouched = isPressed;
                    return;
                }

                this._raycastInteractables(controller, this._interactables);
                let closestInteractable = controller['closestInteractable'];
                if(!isPressed) {
                    this._mobileWasTouched = false;
                    if(closestInteractable == selectedInteractable) {
                        selectedInteractable.triggerActions(option,
                            controller['closestPoint'], userDistance);
                    }
                    selectedInteractable.removeSelectedBy(option);
                } else if(selectedInteractable == closestInteractable) {
                    selectedInteractable.triggerDraggableActions(option,
                        controller['closestPoint'], userDistance);
                }
            } else if(isPressed) {
                this._mobileWasTouched = true;
                this._raycastInteractables(controller, this._interactables);
                let closestInteractable = controller['closestInteractable'];
                if(closestInteractable) {
                    closestInteractable.addSelectedBy(option,
                        controller['closestPoint'], userDistance);
                    this._selectedInteractables[option] = closestInteractable;
                }
            }
        }
    }

    _updateCursor(controller) {
        let cursor = controller.cursor;
        if(!cursor) return;
        if(controller['closestPoint'] != null) {
            cursor.position.copy(controller['closestPoint']);
            if(!cursor.visible) {
                cursor.visible = true;
            }
        } else {
            if(cursor.visible) {
                cursor.visible = false;
            }
        }
    }

    _updateForXREdit() {
        if(!global.sessionActive) return;
        if(TransformControlsHandler.isTwoHandScaling()) {
            TransformControlsHandler.scaleWithTwoHands();
            return;
        }
        let controllersForPointerInteractables = {};
        let controllersForPlacement = {};
        let controllers = [];
        for(let option in Hands) {
            let controller = {
                option: option,
                raycaster: this._getRaycaster(option),
                isPressed: this._isControllerPressed(option),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
                cursor: this._cursors[option],
                userDistance: Number.MAX_SAFE_INTEGER,
            };
            if(TransformControlsHandler.isPlacingObject(option)) {
                controllersForPlacement[option] = controller;
            } else {
                controllersForPointerInteractables[option] = controller;
                this._raycastInteractables(controller, this._interactables);
            }
            controllers.push(controller);
        }

        this._updateInteractables(controllersForPointerInteractables);
        TransformControlsHandler.checkPlacement(controllersForPlacement);
        for(let controller of controllers) {
            this._updateCursor(controller)
        }
    }

    _updateForXRCopyPaste() {
        if(!global.sessionActive) return;
        let controllers = {};
        for(let option in Hands) {
            let controller = {
                option: option,
                raycaster: this._getRaycaster(option),
                isPressed: this._isControllerPressed(option),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
                cursor: this._cursors[option],
                userDistance: Number.MAX_SAFE_INTEGER,
            };
            controllers[option] = controller;
            this._raycastInteractables(controller, this._interactables);
        }

        this._updateInteractables(controllers);
        if(controllers[Hands.RIGHT].closestPoint == null)
            CopyPasteControlsHandler.checkPlacement(controllers[Hands.RIGHT]);
        for(let option in controllers) {
            this._updateCursor(controllers[option])
        }
    }

    _updateForXRDelete() {
        if(!global.sessionActive) return;
        let controllers = {};
        for(let option in Hands) {
            let controller = {
                option: option,
                raycaster: this._getRaycaster(option),
                isPressed: this._isControllerPressed(option),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
                cursor: this._cursors[option],
                userDistance: Number.MAX_SAFE_INTEGER,
            };
            controllers[option] = controller;
            this._raycastInteractables(controller, this._interactables);
        }

        this._updateInteractables(controllers);
        for(let option in controllers) {
            this._updateCursor(controllers[option])
        }
    }

    _updateForXR() {
        if(!global.sessionActive) return;
        let controllers = {};
        for(let option in Hands) {
            let controller = {
                option: option,
                raycaster: this._getRaycaster(option),
                isPressed: this._isControllerPressed(option),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
                cursor: this._cursors[option],
                userDistance: Number.MAX_SAFE_INTEGER,
            };
            controllers[option] = controller;
            this._raycastInteractables(controller, this._interactables);
        }

        this._updateInteractables(controllers);
        for(let option in controllers) {
            this._updateCursor(controllers[option])
        }
    }

    _updateForPointer() {
        if(!global.sessionActive)
            return;

        let controllers = {
            "POINTER": {
                option: "POINTER",
                raycaster: this._getRaycaster("POINTER"),
                isPressed: this._isControllerPressed("POINTER"),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
                userDistance: Number.MAX_SAFE_INTEGER,
            }
        };

        if(TransformControlsHandler.isPlacingObject()) {
            TransformControlsHandler.checkPlacement(controllers);
            return;
        }
        this._raycastInteractables(controllers['POINTER'], this._interactables);
        this._updateInteractables(controllers);
        let style = global.renderer.domElement.style;
        if(this._hoveredInteractables['POINTER']) {
            if(!style.cursor) style.cursor = 'pointer';
        } else if(style.cursor == 'pointer') {
            style.cursor = '';
        }
    }

    _updateForMobile() {
        if(!global.sessionActive)
            return;
        let controllers = {
            "MOBILE": {
                option: "MOBILE",
                raycaster: this._getRaycaster("MOBILE"),
                isPressed: this._isControllerPressed("MOBILE"),
                closestPoint: null,
                closestPointDistance: Number.MAX_SAFE_INTEGER,
                userDistance: Number.MAX_SAFE_INTEGER,
            }
        };

        if(TransformControlsHandler.isPlacingObject()) {
            TransformControlsHandler.checkPlacement(controllers);
            return;
        }
        this._updateInteractablesMobile(controllers);
    }

}

let pointerInteractableHandler = new PointerInteractableHandler();
export default pointerInteractableHandler;
