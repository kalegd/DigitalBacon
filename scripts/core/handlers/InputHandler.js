/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Hands from '/scripts/core/enums/Hands.js';
import { Object3D, Vector2 } from 'three';
import { XRControllerModelFactory } from '/scripts/three/examples/jsm/webxr/XRControllerModelFactory.js';

const controllerModelFactory = new XRControllerModelFactory();

//Provides Polling for XR Input Sources, Keyboard, or Mobile Touch Screen inputs
class InputHandler {
    init(container, renderer, controllerParent) {
        this._container = container;
        this._renderer = renderer;
        this._renderer.domElement.tabIndex = "1";
        this._controllerParent = controllerParent;
        this._session;
        this._leftXRInputSource;
        this._rightXRInputSource;
        this._leftXRControllerModel = new Object3D();
        this._rightXRControllerModel = new Object3D();
        this._leftXRController = {
            "targetRay": new Object3D(),
            "grip": new Object3D()
        };
        this._rightXRController = {
            "targetRay": new Object3D(),
            "grip": new Object3D()
        };
        this._pointerPosition = new Vector2();
        this._pointerPressed = false;
        this._keysPressed = new Set();
        this._keyCodesPressed = new Set();
        this._screenTouched = false;
        this._joystickAngle = 0;
        this._joystickDistance = 0;
        this._addEventListeners();
    }

    _addEventListeners() {
        if(global.deviceType == "XR") {
            //XR Event Listeners
            this._renderer.xr.addEventListener("sessionstart", (event) => {
                this._onXRSessionStart(event)
            });
            this._renderer.xr.addEventListener("sessionend", (event) => {
                this._onXRSessionEnd(event)
            });
        } else if (global.deviceType == "POINTER") {
            //POINTER Event Listeners
            this._renderer.domElement.addEventListener('keydown', (event) => {
                this._keysPressed.add(event.key);
                this._keyCodesPressed.add(event.code);
            });
            this._renderer.domElement.addEventListener('keyup', (event) => {
                this._keysPressed.delete(event.key);
                this._keyCodesPressed.delete(event.code);
            });
            window.addEventListener('blur', (event) => {
                this._keysPressed.clear();
                this._keyCodesPressed.clear();
            });
            this._renderer.domElement.addEventListener( 'mousedown', () => {
                this._pointerPressed = true;
            });
            this._renderer.domElement.addEventListener( 'mouseup', () => {
                this._pointerPressed = false;
            });
            this._renderer.domElement.addEventListener( 'mousemove', (event) =>{
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.clientX - rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.clientY - rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            this._container.addEventListener('mouseup', () => {
                this._renderer.domElement.focus();
            });
        } else if(global.deviceType == "MOBILE") {
            //MOBILE Event Listeners
            this._renderer.domElement.addEventListener('touchstart', () => {
                this._screenTouched = true;
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.touches[0].clientX -rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.touches[0].clientY -rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
            this._renderer.domElement.addEventListener('touchend', () => {
                this._screenTouched = false;
            });
            this._renderer.domElement.addEventListener( 'touchmove', (event) =>{
                let rect = event.target.getBoundingClientRect();
                this._pointerPosition.x = ((event.touches[0].clientX -rect.left)
                    / this._renderer.domElement.clientWidth) * 2 - 1;
                this._pointerPosition.y = -((event.touches[0].clientY -rect.top)
                    / this._renderer.domElement.clientHeight) * 2 + 1;
            });
        }
    }

    createPointerControls() {
        let menuOpenButton = document.getElementById('mobile-menu-open-button');
        menuOpenButton.classList.remove("hidden");
    }

    createMobileControls() {
        let joystickParent = document.getElementById('mobile-joystick');
        let menuOpenButton = document.getElementById('mobile-menu-open-button');
        let menuFlyingParent =document.getElementById('mobile-flying-controls');
        joystickParent.classList.remove("hidden");
        menuOpenButton.classList.remove("hidden");
        menuFlyingParent.classList.remove("hidden");
        let options = {
            zone: joystickParent,
            mode: 'static',
            position: {left: '50%', top: '50%'},
        };
        let manager = nipplejs.create(options);
        let joystick = manager.get(0);
        joystick.on('move', (event, data) => {
            this._joystickAngle = data.angle.radian;
            this._joystickDistance = Math.min(data.force, 1);
        });
        joystick.on('end', () => {
            this._joystickDistance = 0;
        });
    }

    _onXRSessionStart(event) {
        this._session = this._renderer.xr.getSession();
        this._session.oninputsourceschange = (event) => {
            this._onXRInputSourceChange(event);
        };
        let inputSources = this._session.inputSources;
        for(let i = 0; i < inputSources.length; i++) {
            if(inputSources[i].handedness == "right") {
                this._rightXRInputSource = inputSources[i];
                this._controllerParent.add(this._rightXRController.targetRay);
                this._controllerParent.add(this._rightXRController.grip);
                if(this._rightXRControllerModel.children.length == 0) {
                    this._rightXRControllerModel.add(controllerModelFactory
                        .createControllerModel(inputSources[i]));
                }
            } else if(inputSources[i].handedness == "left") {
                this._leftXRInputSource = inputSources[i];
                this._controllerParent.add(this._leftXRController.targetRay);
                this._controllerParent.add(this._leftXRController.grip);
                if(this._leftXRControllerModel.children.length == 0) {
                    this._leftXRControllerModel.add(controllerModelFactory
                        .createControllerModel(inputSources[i]));
                }
            }
        }
    }

    _onXRSessionEnd(event) {
        this._session.oninputsourcechange = null;
        this._session = null;
        this._rightXRInputSource = null;
        this._leftXRInputSource = null;
        this._controllerParent.remove(this._rightXRController.targetRay);
        this._controllerParent.remove(this._rightXRController.grip);
        this._controllerParent.remove(this._leftXRController.targetRay);
        this._controllerParent.remove(this._leftXRController.grip);
    }

    _onXRInputSourceChange(event) {
        for(let i = 0; i < event.removed.length; i++) {
            if(event.removed[i] == this._rightXRInputSource) {
                this._rightXRInputSource = null;
                this._controllerParent.remove(this._rightXRController.targetRay);
                this._controllerParent.remove(this._rightXRController.grip);
            } else if(event.removed[i] == this._leftXRInputSource) {
                this._leftXRInputSource = null;
                this._controllerParent.remove(this._leftXRController.targetRay);
                this._controllerParent.remove(this._leftXRController.grip);
            }
        }
        for(let i = 0; i < event.added.length; i++) {
            if(event.added[i].hand != null) continue; //Don't support hands yet
            if(event.added[i].handedness == "right") {
                this._rightXRInputSource = event.added[i];
                this._controllerParent.add(this._rightXRController.targetRay);
                this._controllerParent.add(this._rightXRController.grip);
                if(this._rightXRControllerModel.children.length == 0) {
                    this._rightXRControllerModel.add(controllerModelFactory
                        .createControllerModel(event.added[i]));
                }
            } else if(event.added[i].handedness == "left") {
                this._leftXRInputSource = event.added[i];
                this._controllerParent.add(this._leftXRController.targetRay);
                this._controllerParent.add(this._leftXRController.grip);
                if(this._leftXRControllerModel.children.length == 0) {
                    this._leftXRControllerModel.add(controllerModelFactory
                        .createControllerModel(event.added[i]));
                }
            }
        }
    }

    getXRGamepad(hand) {
        if(hand == Hands.LEFT) {
            return (this._leftXRInputSource)
                ? this._leftXRInputSource.gamepad
                : null;
        } else if(hand == Hands.RIGHT) {
            return (this._rightXRInputSource)
                ? this._rightXRInputSource.gamepad
                : null;
        } else {
            return null;
        }
    }

    getXRController(hand, type) {
        if(hand == Hands.LEFT) {
            return this._leftXRController[type];
        } else if(hand == Hands.RIGHT) {
            return this._rightXRController[type];
        }
    }
    
    getXRControllerModel(hand) {
        if(hand == Hands.LEFT) {
            return this._leftXRControllerModel;
        } else if(hand == Hands.RIGHT) {
            return this._rightXRControllerModel;
        }
    }

    getPointerPosition() {
        return this._pointerPosition;
    }

    isPointerPressed() {
        return this._pointerPressed;
    }

    isKeyPressed(key) {
        return this._keysPressed.has(key);
    }

    isKeyCodePressed(code) {
        return this._keyCodesPressed.has(code);
    }

    isScreenTouched() {
        return this._screenTouched;
    }

    getJoystickAngle() {
        return this._joystickAngle;
    }

    getJoystickDistance() {
        return this._joystickDistance;
    }

    _updateXRController(frame, referenceSpace, xrInputSource, xrController) {
        if(xrInputSource) {
            let targetRayPose = frame.getPose(
                xrInputSource.targetRaySpace, referenceSpace
            );
            if(targetRayPose != null) {
                xrController.targetRay.matrix.fromArray(
                    targetRayPose.transform.matrix
                );
                xrController.targetRay.matrix.decompose(
                    xrController.targetRay.position,
                    xrController.targetRay.rotation,
                    xrController.targetRay.scale
                );
            }

            let gripPose = frame.getPose(
                xrInputSource.gripSpace, referenceSpace
            );
            if ( gripPose !== null ) {
                xrController.grip.matrix.fromArray(gripPose.transform.matrix);
                xrController.grip.matrix.decompose(
                    xrController.grip.position,
                    xrController.grip.rotation,
                    xrController.grip.scale
                );
            }
        }
    }

    update(frame) {
        if(frame == null) {
            return;
        }
        //Assumes device type is XR
        let referenceSpace = this._renderer.xr.getReferenceSpace();
        this._updateXRController(
            frame,
            referenceSpace,
            this._leftXRInputSource,
            this._leftXRController
        );
        this._updateXRController(
            frame,
            referenceSpace,
            this._rightXRInputSource,
            this._rightXRController
        );
    }
}

let inputHandler = new InputHandler();
export default inputHandler;
