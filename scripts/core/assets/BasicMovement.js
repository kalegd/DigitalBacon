/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Hands from '/scripts/core/enums/Hands.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class BasicMovement {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        this._avatar = params['Avatar'];
        this._userObj = params['User Object'];
        this._velocity = new THREE.Vector3();
        this._verticalVelocity = 0;
        this._worldVelocity = new THREE.Vector3();
        this._snapRotationTriggered = false;
    }

    _setupMobileFlyingButtons() {
        this._mobileUp = false;
        this._mobileDown = false;
        let upButton = document.getElementById("mobile-flying-up-button")
        let downButton = document.getElementById("mobile-flying-down-button")
        upButton.addEventListener('touchstart',
            () => { this._mobileUp = true; });
        upButton.addEventListener('touchend',
            () => { this._mobileUp = false; });
        downButton.addEventListener('touchstart',
            () => { this._mobileDown = true; });
        downButton.addEventListener('touchend',
            () => { this._mobileDown = false; });
    }

    _moveForward(velocity, timeDelta) {
        // move forward parallel to the xz-plane
        // assumes camera.up is y-up
        vector3s[0].setFromMatrixColumn(global.camera.matrixWorld, 0);
        vector3s[0].crossVectors(this._userObj.up, vector3s[0]);
        // not using addScaledVector because we use vector3s[0] later
        vector3s[0].multiplyScalar(velocity);
        this._worldVelocity.add(vector3s[0]);
        vector3s[0].multiplyScalar(timeDelta);
        this._userObj.position.add(vector3s[0]);
    };

    _moveRight(velocity, timeDelta) {
        vector3s[0].setFromMatrixColumn(global.camera.matrixWorld, 0);
        vector3s[0].y = 0;
        vector3s[0].multiplyScalar(velocity);
        this._worldVelocity.add(vector3s[0]);
        vector3s[0].multiplyScalar(timeDelta);
        this._userObj.position.add(vector3s[0]);
    };

    _moveUp(velocity, timeDelta) {
        velocity = this._userObj.scale.y * velocity;
        this._worldVelocity.setY(velocity);
        vector3s[0].fromArray([0, velocity * timeDelta, 0]);
        this._userObj.position.add(vector3s[0]);
    }

    _snapLeft() {
        this._userObj.rotateY(Math.PI/8);
    }

    _snapRight() {
        this._userObj.rotateY(-Math.PI/8);
    }

    getWorldVelocity() {
        return this._worldVelocity;
    }

    update(timeDelta) {
        if(global.deviceType == "XR") {
            this._updatePositionVR(timeDelta);
            this.update = this._updatePositionVR;
        } else if(global.deviceType == "POINTER") {
            this._updatePosition(timeDelta);
            this.update = this._updatePosition;
        } else if(global.deviceType == "MOBILE") {
            this._setupMobileFlyingButtons();
            this._updatePositionMobile(timeDelta);
            this.update = this._updatePositionMobile;
        }
    }

    _updatePosition(timeDelta) {
        this._worldVelocity.set(0, 0, 0);
        if(timeDelta > 1) return;
        let movementSpeed = SettingsHandler.getMovementSpeed();
        let flightEnabled = SettingsHandler.isFlyingEnabled();
        // Decrease the velocity.
        let slowdownFactor = (1 - timeDelta) * 0.88;
        this._velocity.x *= slowdownFactor;
        if(flightEnabled)
            this._verticalVelocity *= slowdownFactor;
        this._velocity.z *= slowdownFactor;

        if(global.sessionActive && !global.keyboardLock) {
            if (InputHandler.isKeyCodePressed("ArrowUp")
                    || InputHandler.isKeyCodePressed("KeyW"))
                this._velocity.z += movementSpeed / 4;
            if (InputHandler.isKeyCodePressed("ArrowDown")
                    || InputHandler.isKeyCodePressed("KeyS"))
                this._velocity.z -= movementSpeed / 4;
            if (InputHandler.isKeyCodePressed("ArrowLeft")
                    || InputHandler.isKeyCodePressed("KeyA"))
                this._velocity.x -= movementSpeed / 4;
            if (InputHandler.isKeyCodePressed("ArrowRight")
                    || InputHandler.isKeyCodePressed("KeyD"))
                this._velocity.x += movementSpeed / 4;
            if (flightEnabled && InputHandler.isKeyCodePressed("Space")
                    != InputHandler.isKeyCodePressed("ShiftLeft")) {
                this._verticalVelocity =
                    (InputHandler.isKeyCodePressed("Space"))
                        ? movementSpeed
                        : -movementSpeed;
            }
        }

        if(this._velocity.length() > movementSpeed) {
            this._velocity.normalize().multiplyScalar(movementSpeed);
        }
        if(this._avatar) {
            this._moveRight(this._velocity.x, timeDelta);
            vector3s[1].copy(vector3s[0]);
            this._moveForward(this._velocity.z, timeDelta);
            vector3s[1].add(vector3s[0]);
            if(vector3s[1].length() > 0.001 * SettingsHandler.getUserScale()) {
                vector3s[1].multiplyScalar(-2);
                this._avatar.lookAtLocal(vector3s[1]);
            }
            if(flightEnabled) {
                this._moveUp(this._verticalVelocity, timeDelta);
            }
        } else {
            this._moveRight(this._velocity.x, timeDelta);
            this._moveForward(this._velocity.z, timeDelta);
        }
        this._userObj.updateMatrixWorld(true);
    }

    _updatePositionMobile(timeDelta) {
        this._worldVelocity.set(0, 0, 0);
        if(timeDelta > 1) return;
        let movementSpeed = SettingsHandler.getMovementSpeed();
        let flightEnabled = SettingsHandler.isFlyingEnabled();
        this._velocity.x = 0;
        if(flightEnabled)
            this._verticalVelocity *= (1 - timeDelta) * 0.88;
        this._velocity.z = 0;
        if(global.sessionActive && !global.keyboardLock) {
            let joystickAngle = InputHandler.getJoystickAngle();
            let joystickDistance = InputHandler.getJoystickDistance();
            let movingDistance = movementSpeed * joystickDistance;
            this._velocity.x = movingDistance * Math.cos(joystickAngle);
            this._velocity.z = movingDistance * Math.sin(joystickAngle);
            if(flightEnabled && this._mobileUp != this._mobileDown) {
                this._verticalVelocity = (this._mobileUp)
                    ? movementSpeed
                    : -movementSpeed;
            }
        }

        if(this._velocity.length() > movementSpeed) {
            this._velocity.normalize().multiplyScalar(movementSpeed);
        }
        if(this._avatar) {
            this._moveRight(this._velocity.x, timeDelta);
            vector3s[1].copy(vector3s[0]);
            this._moveForward(this._velocity.z, timeDelta);
            vector3s[1].add(vector3s[0]);
            if(vector3s[1].length() > 0.001 * SettingsHandler.getUserScale()) {
                vector3s[1].multiplyScalar(-2);
                this._avatar.lookAtLocal(vector3s[1]);
            }
            if(flightEnabled) {
                this._moveUp(this._verticalVelocity, timeDelta);
            }
        } else {
            this._moveRight(this._velocity.x, timeDelta);
            this._moveForward(this._velocity.z, timeDelta);
        }
        this._userObj.updateMatrixWorld(true);
    }

    _updatePositionVR(timeDelta) {
        this._worldVelocity.set(0, 0, 0);
        if(timeDelta > 1) return;
        let movementSpeed = SettingsHandler.getMovementSpeed();
        let flightEnabled = SettingsHandler.isFlyingEnabled();
        let movementGamepad;
        let rotationGamepad;
        if(SettingsHandler.areJoysticksSwapped()) {
            movementGamepad = InputHandler.getXRGamepad(Hands.RIGHT);
            rotationGamepad = InputHandler.getXRGamepad(Hands.LEFT);
        } else {
            movementGamepad = InputHandler.getXRGamepad(Hands.LEFT);
            rotationGamepad = InputHandler.getXRGamepad(Hands.RIGHT);
        }
        this._velocity.x = 0;
        this._velocity.y = 0;
        this._velocity.z = 0;
        if(movementGamepad) {
            let axes = movementGamepad.axes;
            this._velocity.z = -1 * movementSpeed * axes[3];//Forward/Backward
            this._velocity.x = movementSpeed * axes[2];//Left/Right

            this._moveRight(this._velocity.x, timeDelta);
            this._moveForward(this._velocity.z, timeDelta);
        }
        if(rotationGamepad) {
            let verticalForce = rotationGamepad.axes[3];
            let rotationForce = rotationGamepad.axes[2];
            if(Math.abs(rotationForce) > 0.5) {
                if(!this._snapRotationTriggered) {
                    this._snapRotationTriggered = true; 
                    (rotationForce > 0) ? this._snapRight() : this._snapLeft();
                }
            } else {
                this._snapRotationTriggered = false;
            }
            if(flightEnabled && Math.abs(verticalForce) > 0.2) {
                this._velocity.y = -1 * movementSpeed * verticalForce;
                this._moveUp(this._velocity.y, timeDelta);
            }
        } else {
            this._snapRotationTriggered = false;
        }
        this._userObj.updateMatrixWorld(true);
    }
}
