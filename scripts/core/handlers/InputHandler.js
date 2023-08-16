/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import XRInputDeviceTypes from '/scripts/core/enums/XRInputDeviceTypes.js';
import { Object3D, Vector2 } from 'three';
import { XRControllerModelFactory } from '/scripts/three/examples/jsm/webxr/XRControllerModelFactory.js';

const controllerModelFactory = new XRControllerModelFactory();

//Provides Polling for XR Input Sources, Keyboard, or Mobile Touch Screen inputs
class InputHandler {
    init(container, renderer, controllerParent) {
        this._container = container;
        this._renderer = renderer;
        this._controllerParent = controllerParent;
        this._renderer.domElement.tabIndex = "1";
        this._session;
        this._xrInputDevices = {};
        for(let type in XRInputDeviceTypes) {
            this._xrInputDevices[type] = {};
        }
        this._pointerPosition = new Vector2();
        this._pointerPressed = false;
        this._keysPressed = new Set();
        this._keyCodesPressed = new Set();
        this._screenTouched = false;
        this._joystickAngle = 0;
        this._joystickDistance = 0;
        this._extraControls = {};
        this._extraControlsDiv = document.getElementById('extra-controls');
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
        this._extraControlsDiv.classList.remove("hidden");
    }

    createMobileControls() {
        let joystickParent = document.getElementById('mobile-joystick');
        let menuOpenButton = document.getElementById('mobile-menu-open-button');
        joystickParent.classList.remove("hidden");
        menuOpenButton.classList.remove("hidden");
        this._extraControlsDiv.classList.remove("hidden");
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
            this._addXRInputSource(inputSources[i]);
        }
    }

    _onXRSessionEnd(event) {
        this._session.oninputsourcechange = null;
        this._session = null;
        for(let type in this._xrInputDevices) {
            for(let handedness in this._xrInputDevices[type]) {
                delete this._xrInputDevices[type][handedness].inputSource;
            }
        }
    }

    _onXRInputSourceChange(event) {
        for(let i = 0; i < event.removed.length; i++) {
            this._deleteXRInputSource(event.removed[i]);
        }
        for(let i = 0; i < event.added.length; i++) {
            this._addXRInputSource(event.added[i]);
        }
    }

    _addXRInputSource(inputSource) {
        let type = (inputSource.hand != null)
            ? XRInputDeviceTypes.HAND
            : XRInputDeviceTypes.CONTROLLER;

        let handedness = inputSource.handedness.toUpperCase();
        if(handedness in Handedness) {
            let xrInputDevice = this._xrInputDevices[type][handedness];
            if(!xrInputDevice) {
                xrInputDevice = { controllers: {} };
                this._xrInputDevices[type][handedness] = xrInputDevice;
                if(inputSource.targetRaySpace) {
                    xrInputDevice.controllers.targetRay = new Object3D();
                    this._controllerParent.add(xrInputDevice.controllers
                        .targetRay);
                }
                if(inputSource.gripSpace) {
                    xrInputDevice.controllers.grip = new Object3D();
                    this._controllerParent.add(xrInputDevice.controllers.grip);
                }
            }
            xrInputDevice.inputSource = inputSource;
            if(!xrInputDevice.model) {
                xrInputDevice.model = controllerModelFactory
                    .createControllerModel(inputSource);
            }
        }
    }

    _deleteXRInputSource(inputSource) {
        let type = (inputSource.hand != null)
            ? XRInputDeviceTypes.HAND
            : XRInputDeviceTypes.CONTROLLER;

        let handedness = inputSource.handedness.toUpperCase();
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        if(xrInputDevice && xrInputDevice.inputSource)
            delete this._xrInputDevices[type][handedness].inputSource;
    }

    _getXRInputDevice(type, handedness) {
        return (this._xrInputDevices[type])
            ? this._xrInputDevices[type][handedness]
            : null;
    }

    getXRInputSource(type, handedness) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.inputSource : null;
    }

    getXRGamepad(handedness) {
        let type = XRInputDeviceTypes.CONTROLLER;
        let inputSource = this.getXRInputSource(type, handedness);
        return (inputSource) ? inputSource.gamepad : null;
    }

    getXRController(type, handedness, space) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.controllers[space] : null;
    }
    
    getXRControllerModel(type, handedness) {
        let xrInputDevice = this._getXRInputDevice(type, handedness);
        return (xrInputDevice) ? xrInputDevice.model : null;
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

    addExtraControlsButton(id, name) {
        let button = document.createElement('button');
        button.id = id;
        button.innerText = name;
        this._extraControlsDiv.appendChild(button);
        this._extraControls[id] = button;
        return button;
    }

    getExtraControlsButton(id) {
        return this._extraControls[id];
    }

    hideExtraControlsButton(id) {
        let button = this._extraControls[id];
        if(button) button.style.display = 'none';
    }

    showExtraControlsButton(id) {
        let button = this._extraControls[id];
        if(button) button.style.display = 'inline-block';
    }

    _updateXRController(frame, referenceSpace, xrInputDevice) {
        let xrInputSource = xrInputDevice.inputSource;
        let xrControllers = xrInputDevice.controllers;
        if(xrInputSource) {
            let targetRayPose = frame.getPose(
                xrInputSource.targetRaySpace, referenceSpace
            );
            if(targetRayPose != null) {
                xrControllers.targetRay.matrix.fromArray(
                    targetRayPose.transform.matrix
                );
                xrControllers.targetRay.matrix.decompose(
                    xrControllers.targetRay.position,
                    xrControllers.targetRay.rotation,
                    xrControllers.targetRay.scale
                );
            }

            let gripPose = frame.getPose(
                xrInputSource.gripSpace, referenceSpace
            );
            if ( gripPose !== null ) {
                xrControllers.grip.matrix.fromArray(gripPose.transform.matrix);
                xrControllers.grip.matrix.decompose(
                    xrControllers.grip.position,
                    xrControllers.grip.rotation,
                    xrControllers.grip.scale
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
        for(let type in this._xrInputDevices) {
            for(let handedness in this._xrInputDevices[type]) {
                this._updateXRController(frame, referenceSpace,
                    this._xrInputDevices[type][handedness]);
            }
        }
    }
}

let inputHandler = new InputHandler();
export default inputHandler;
