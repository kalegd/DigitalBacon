/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { Assets, DigitalBaconUI, LibraryHandler, ProjectHandler, PubSub, THREE, getCamera, getDeviceType, getRenderer, isEditor, isImmersionDisabled } = window.DigitalBacon;
const { System } = Assets;
const { InputHandler } = DigitalBaconUI;

const deviceType = getDeviceType();
const slideRegex = /^[1-9][0]{0,1}\.jpg$/;
const coilHeight = 3;
const maxCameraDistance = 3.5;
const maxRotationPercent = coilHeight / maxCameraDistance;
const maxTravelPercent = 1 - maxRotationPercent;
const movementSpeed = 0.2;
const zScale = 0.5625;
const arrowKeyCodes = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"];
const finalPositions = [
    new THREE.Vector3(0, -4.5, 1 * zScale),
    new THREE.Vector3(0, -4.5, 0 * zScale),
    new THREE.Vector3(0, -4.5, -1 * zScale),
    new THREE.Vector3(-1, -4.5, -1 * zScale),
    new THREE.Vector3(-1, -4.5, 0 * zScale),
    new THREE.Vector3(-1, -4.5, 1 * zScale),
    new THREE.Vector3(-1, -4.5, 2 * zScale),
    new THREE.Vector3(0, -4.5, 2 * zScale),
    new THREE.Vector3(1, -4.5, 1 * zScale),
    new THREE.Vector3(1, -4.5, 0),
    new THREE.Vector3(0.55, -4.5, 0.4 * zScale),
];
const lookAtPoint = new THREE.Object3D();
const finalQuaternion = new THREE.Quaternion(0.707, 0, 0, -0.707);

export default class ScrollSystem extends System {
    constructor(params = {}) {
        params['assetId'] = ScrollSystem.assetId;
        super(params);
        if(isEditor() || !isImmersionDisabled()) {
            this.update = () => {};
            return;
        }
        this._setup();
    }

    _setup() {
        let assets = ProjectHandler.getAssets();
        this._slides = [];
        this._camera = getCamera();
        this._renderer = getRenderer();
        this._velocity = new THREE.Vector3();
        for(let assetId in assets) {
            let asset = assets[assetId];
            if(asset.name == 'Box') {
                this._root = asset;
                asset.object.add(lookAtPoint);
            } else if(asset.name == 'pixel-speech-bubble.png') {
                this._speechBubble = asset;
                asset.object.visible = false;
            } else if(asset.name == 'Chibi Business Man') {
                this._mixer = new THREE.AnimationMixer(asset.object);
                let clips = LibraryHandler.getAnimations(asset.assetId);
                this._action = this._mixer.clipAction(clips[0]);
                this._action.play();
                console.log(this._clips);
                this._businessMan = asset;
                this._businessMan.originalQuaternion = asset.object.quaternion
                    .clone();
                this._businessMan.finalQuaternion = this._businessMan
                    .originalQuaternion.clone();
                this._businessMan.deltaQuaternion = new THREE.Quaternion();
                this._businessMan.originalPosition = asset.object.position
                    .clone();
                this._businessMan.finalPosition = finalPositions[10].clone();
                this._businessMan.deltaPosition = new THREE.Vector3();
            } else if(slideRegex.test(asset.name)) {
                let index = Number(asset.name.replace('.jpg', '')) - 1;
                this._slides[index] = asset;
                asset.originalQuaternion = asset.object.quaternion.clone();
                asset.originalPosition = asset.object.position.clone();
                asset.delta = asset.object.position.clone().negate()
                    .add(finalPositions[index]);
            }
        }
        if(!this._root || !this._businessMan || this._slides.length != 10)
            this.update = () => {};
    }

    _getDefaultName() {
        return ScrollSystem.assetName;
    }

    get description() {
        return 'Scrolls assets depending on scroll percent of an html element';
    }

    _updateCamera(scrollPercent) {
        this._camera.position.y = scrollPercent * -maxCameraDistance;
        let ratio = window.innerHeight / window.innerWidth;
        this._camera.position.z = (ratio <= 1)
            ? 0
            : ratio - 1;
    }

    _updateRoot(scrollPercent) {
        let rotationPercent = scrollPercent / maxRotationPercent;
        let travelPercent = 0;
        if(rotationPercent > 1) {
            rotationPercent = 1;
            travelPercent = (scrollPercent - maxRotationPercent)
                / maxTravelPercent;
            this._travel(travelPercent);
        } else {
            this._travel(0);
        }
        this._root.object.rotation.y = rotationPercent * Math.PI * -2.25;
        this._updateBusinessMan(travelPercent);
    }

    _travel(scrollPercent) {
        //let ratio = Math.min(window.innerHeight / window.innerWidth;
        //this._camera.position.z = (ratio <= 1)
        //    ? 0
        //    : ratio - 1;
        this._camera.rotation.x = scrollPercent * -20 * Math.PI / 180;
        this._camera.position.z += scrollPercent / 2;
        if(scrollPercent == this._lastTravelScrollPercent) return;
        this._lastTravelScrollPercent = scrollPercent;
        for(let asset of this._slides) {
            asset.object.position.copy(asset.originalPosition)
                .addScaledVector(asset.delta, scrollPercent);
            asset.object.quaternion.slerpQuaternions(asset.originalQuaternion,
                finalQuaternion, scrollPercent);
        }
    }

    _updateBusinessMan(scrollPercent) {
        //scrollPercent = Math.max(scrollPercent / 0.5 - 1, 0);
        if(scrollPercent == 0) {
            if(this._businessManPendingReset) {
                this._businessMan.finalQuaternion = this._businessMan
                    .originalQuaternion.clone();
                this._businessMan.finalPosition = finalPositions[10].clone();
                this._businessManPendingReset = false;
            }
            this._walkEnabled = false;
            this._speechBubble.object.visible = false;
            if(deviceType == 'POINTER') {
                this._removeArrowCapture();
            } else {
                InputHandler.hideJoystick();
            }
            return;
        } else if(scrollPercent < 1) {
            let delta = this._businessMan.deltaPosition;
            delta.copy(this._businessMan.originalPosition).negate()
                    .add(this._businessMan.finalPosition);
            this._businessMan.object.position
                .copy(this._businessMan.originalPosition)
                .addScaledVector(delta, scrollPercent);
            this._businessMan.object.quaternion.slerpQuaternions(
                this._businessMan.originalQuaternion,
                this._businessMan.finalQuaternion,
                scrollPercent);
            this._walkEnabled = false;
            this._speechBubble.object.visible = false;
            if(deviceType == 'POINTER') {
                this._removeArrowCapture();
            } else {
                InputHandler.hideJoystick();
            }
        } else if(!this._walkEnabled) {
            this._businessMan.object.position.copy(
                this._businessMan.finalPosition);
            this._businessManPendingReset = true;
            this._walkEnabled = true;
            this._speechBubble.object.visible = true;
            if(deviceType == 'POINTER') {
                this._addArrowCapture();
            } else {
                InputHandler.showJoystick();
            }
        }
    }

    _addArrowCapture() {
        if(this._captureFunction) return;
        this._captureFunction = (e) => {
            if(arrowKeyCodes.indexOf(e.code) > -1) {
                e.preventDefault();
            }
        }
        this._renderer.domElement.focus();
        window.addEventListener('keydown', this._captureFunction, false);
    }

    _removeArrowCapture() {
        if(!this._captureFunction) return;
        window.removeEventListener('keydown', this._captureFunction, false);
        this._captureFunction = null;
    }

    _walk(timeDelta) {
        if(timeDelta > 1) return;
        
        (deviceType == 'POINTER')
            ? this._setPointerVelocity(timeDelta)
            : this._setJoystickVelocity();

        if(this._velocity.length() > movementSpeed) {
            this._velocity.normalize().multiplyScalar(movementSpeed);
        }

        this._velocity.applyAxisAngle(this._businessMan.object.up, Math.PI / 4);
        this._businessMan.object.position.addScaledVector(this._velocity,
            timeDelta);
        this._businessMan.finalPosition.copy(this._businessMan.object.position);
        this._businessMan.finalQuaternion.copy(
            this._businessMan.object.quaternion);
        this._mixer.update(timeDelta * 1.5);
        if(this._velocity.length() > 0.05) {
            this._action.play();
            lookAtPoint.getWorldPosition(
                lookAtPoint.position.copy(this._businessMan.object.position)
                .add(this._velocity));
            this._businessMan.object.lookAt(lookAtPoint.position);
        } else {
            this._action.reset();
        }
        this._velocity.applyAxisAngle(this._businessMan.object.up, Math.PI /-4);
    }

    _setPointerVelocity(timeDelta) {
        // Decrease the velocity.
        let slowdownFactor = (1 - timeDelta) * 0.88;
        this._velocity.x *= slowdownFactor;
        this._velocity.z *= slowdownFactor;

        if (InputHandler.isKeyCodePressed("ArrowUp")
                || InputHandler.isKeyCodePressed("KeyW"))
            this._velocity.z -= movementSpeed / 4;
        if (InputHandler.isKeyCodePressed("ArrowDown")
                || InputHandler.isKeyCodePressed("KeyS"))
            this._velocity.z += movementSpeed / 4;
        if (InputHandler.isKeyCodePressed("ArrowLeft")
                || InputHandler.isKeyCodePressed("KeyA"))
            this._velocity.x -= movementSpeed / 4;
        if (InputHandler.isKeyCodePressed("ArrowRight")
                || InputHandler.isKeyCodePressed("KeyD"))
            this._velocity.x += movementSpeed / 4;
    }

    _setJoystickVelocity() {
        let joystickAngle = InputHandler.getJoystickAngle();
        let joystickDistance = InputHandler.getJoystickDistance();
        let movingDistance = movementSpeed * joystickDistance;
        this._velocity.x = movingDistance * Math.cos(joystickAngle);
        this._velocity.z = movingDistance * -Math.sin(joystickAngle);
    }

    update(timeDelta) {
        if(this._walkEnabled) this._walk(timeDelta);
        let maxHeight = document.body.scrollHeight - window.innerHeight;
        let scrollPosition = window.scrollY;
        let scrollPercent = Math.min(Math.max(scrollPosition / maxHeight, 0),1);
        this._updateCamera(scrollPercent);
        //if(scrollPercent == this._lastScrollPercent) return;
        //this._lastScrollPercent = scrollPercent;
        this._updateRoot(scrollPercent);
    }

    static assetId = 'c2a84e6d-44d5-42dd-b516-d777409d2287';
    static assetName = 'Scroll System';
}

ProjectHandler.registerAsset(ScrollSystem);

