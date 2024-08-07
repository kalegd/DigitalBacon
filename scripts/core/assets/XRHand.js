/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import XRDevice from '/scripts/core/assets/XRDevice.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import HandMenu from '/scripts/core/menu/HandMenu.js';
import { Handedness, InputHandler, XRInputDeviceTypes } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import { Plane, Raycaster, Vector3 } from 'three';

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/';
const BONE_ANGLE = 2.6;
const PALM_ANGLE = 0.7;
const THUMB_ANGLE = 0.2;
const BONE_SETS = [
    [5,6,7],
    [5,6,9],
    [10,11,12],
    [10,11,14],
    [15,16,17],
    [15,16,19],
    [20,21,22],
    [20,21,24],
];

export default class XRHand extends XRDevice {
    constructor(params = {}) {
        params['assetId'] = XRHand.assetId;
        super(params);
        this._handedness = params['handedness'];
        if(!(this._handedness in Handedness)) {
            throw new Error("hand must be LEFT or RIGHT");
        }
        let controllerModel = params['controllerModel'];
        if(controllerModel) {
            this._object.add(controllerModel);
            this._modelObject = controllerModel;
            this._modelUrl = DEFAULT_HAND_PROFILE_PATH
                + this._handedness.toLowerCase() + '.glb';
            this._isUsers = true;
            this._enableARMask();
        }
        this._palmDirection = new Vector3();
        this._raycasterOrigin = new Vector3();
        this._raycasterDirection = new Vector3();
    }

    _registerOwner(params) {
        let owner = ProjectHandler.getSessionAsset(params['parentId']);
        if(owner.registerXRHand) {
            owner.registerXRHand(params['handedness'], this);
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['handedness'] = this._handedness;
        return params;
    }

    addFromTargetRay(asset, position, rotation) {
        let hand = InputHandler.getXRController(XRInputDeviceTypes.HAND,
            this._handedness, 'targetRay');
        let assetObject = asset.object;
        if(!hand) return;
        hand.add(assetObject);
        if(position) assetObject.position.fromArray(position);
        if(rotation) assetObject.rotation.fromArray(rotation);
        asset.attachTo(this);
    }

    get handedness() { return this._handedness; }

    getTargetRayDirection() {
        let xrController = InputHandler.getXRController(XRInputDeviceTypes.HAND,
            this._handedness, 'targetRay');
        if(!xrController) return null;
        xrController.getWorldDirection(this._raycasterDirection).negate()
            .normalize();
        return this._raycasterDirection;
    }

    getRaycaster() {
        let xrHand = InputHandler.getXRController(XRInputDeviceTypes.HAND,
            this._handedness, 'targetRay');
        if(!xrHand) return null;
        xrHand.getWorldPosition(this._raycasterOrigin);
        xrHand.getWorldDirection(this._raycasterDirection).negate()
            .normalize();
        return new Raycaster(this._raycasterOrigin, this._raycasterDirection,
            0.01, 50);
    }

    getPalmDirection() {
        if(this._isUsers) {
            this._palmDirection.copy(this._modelObject.motionController
                .palmDirection);
        } else if(this._handedness == Handedness.LEFT) {
            this._palmDirection.set(0.9750661112291139, -0.10431964344732528,
                0.1958660688459766);
            this._object.localToWorld(this._palmDirection)
                .sub(this.getWorldPosition());
        } else {
            this._palmDirection.set(-0.9750665315668015, -0.1043194340529684,
                0.19586401335899684);
            this._object.localToWorld(this._palmDirection)
                .sub(this.getWorldPosition());
        }
        return this._palmDirection;
    }

    isButtonPressed(index) {
        if(index == 0) {
            return this._modelObject.motionController.isPinching;
        } else if(index == 1) {
            return this._modelObject.motionController.isGrabbing;
        }
        return false;
    }

    pushDataForRTC(data) {
        let position = this._object.position.toArray();
        let rotation = this._object.rotation.toArray();
        rotation.pop();
        data.push(...position);
        data.push(...rotation);
    }

    createHandMenu() {
        if(this._handMenu) return;
        this._handMenu = new HandMenu();
        //Below is to get the menu positioned well for the apple vision pro
        //In this doesn't work out with any future headsets, we may want to use
        //the position of one of the bones in the hand
        let targetRayController = InputHandler.getXRController(
            XRInputDeviceTypes.HAND, this._handedness, 'targetRay');
        if(this._object == targetRayController)
            this._handMenu.position.set(0, 0.05, -0.05);
    }

    updateHandMenu(timeDelta) {
        if(!this._handMenu) return;
        let bones = this._modelObject.motionController.bones;
        let open = true;
        for(let boneSet of BONE_SETS) {
            vector3s[0].subVectors(bones[boneSet[0]].position,
                bones[boneSet[1]].position);
            vector3s[1].subVectors(bones[boneSet[2]].position,
                bones[boneSet[1]].position);
            if(vector3s[0].angleTo(vector3s[1]) < BONE_ANGLE) {
                open = false;
                break;
            }
        }
        if(open) {//Check thumb knuckle position and palm direction
            if(!this._plane1) {
                this._plane1 = new Plane();
                this._plane2 = new Plane();
            }
            this._plane1.setFromCoplanarPoints(bones[0].position,
                bones[6].position, bones[11].position);
            this._plane2.setFromCoplanarPoints(bones[0].position,
                bones[2].position, bones[6].position);
            if(this._plane1.normal.angleTo(this._plane2.normal) > THUMB_ANGLE) {
                open = false;
            } else {
                global.camera.getWorldPosition(vector3s[0])
                    .sub(this.getWorldPosition());
                if(this.getPalmDirection().angleTo(vector3s[0]) > PALM_ANGLE)
                    open = false;
            }
        }
        if(open != this._handMenu.open) {
            this._handMenu.open = open;
            this._object[open ? 'add' : 'remove'](this._handMenu);
        }
        if(open) {
            let palmDirection = this.getPalmDirection().add(
                this.getWorldPosition());
            this._handMenu.lookAt(palmDirection);
            this._handMenu.update(timeDelta);
        }
    }

    onRemoveFromProject() {
        super.onRemoveFromProject();
        if(this._handMenu) this._handMenu.removeWalkingTool();
    }

    static assetId = 'd26f490e-dc3a-4f96-82d4-ab9f3bdb92b2';
    static assetName = 'XR Hand';
}

ProjectHandler.registerAsset(XRHand);
LibraryHandler.loadBuiltIn(XRHand);
