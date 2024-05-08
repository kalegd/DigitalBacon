/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { TransformControls } from '/node_modules/three/examples/jsm/controls/TransformControls.js';
import { Handedness, InputHandler, PointerInteractableHandler } from '/scripts/DigitalBacon-UI.js';

const BUTTON_QUERY = '#digital-bacon-transform-controls > button';
const MODES = ['translate', 'rotate', 'scale'];

class TransformControlsHandler {
    init(canvas, camera, scene) {
        this._canvas = canvas;
        this._transformControls = new TransformControls(camera, this._canvas);
        this._transformControls.setSize(1.25);
        this._attachedAssets = {};
        this._peerAttachedAssets = {};
        this._placingObject = {};
        this._preTransformStates = {};
        this._id = uuidv4();
        let tool = (global.deviceType == 'XR') ? InteractionTools.EDIT : null;
        PointerInteractableHandler.registerToolHandler(tool,
            (controller) => this._toolHandler(controller));
        if(global.deviceType != 'XR') {
            scene.add(this._transformControls);
            this._addEventListeners();
        }
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (handTool) => {
            if(handTool == InteractionTools.EDIT) return;
            for(let ownerId in this._attachedAssets) {
                this.detach(ownerId);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            if(PartyHandler.isHost()) return;
            for(let ownerId in this._attachedAssets) {
                this.detach(ownerId);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_CONNECTED, (message) => {
            for(let key in this._attachedAssets) {
                let asset = this._attachedAssets[key];
                let isXR = !(key == 'POINTER' || key == 'TOUCH_SCREEN');
                let twoHandScaling = false;
                if(isXR) {
                    let otherKey = this._otherOption(global.userController,key);
                    if(asset == this._attachedAssets[otherKey])
                        twoHandScaling = true;
                }
                PartyHandler.publishInternalMessage('instance_attached', {
                    id: asset.id,
                    assetId: asset.assetId,
                    ownerId: key,
                    position: asset.position,
                    rotation: asset.rotation,
                    isXR: isXR,
                    twoHandScaling: twoHandScaling,
                }, false, message.peer);
            }
        });
        for(let assetType in AssetEntityTypes) {
            PubSub.subscribe(this._id, assetType + '_DELETED', (e) => {
                for(let ownerId in this._attachedAssets) {
                    if(this._attachedAssets[ownerId] == e.asset) {
                        this._detachDeleted(ownerId);
                    }
                }
            });
            PubSub.subscribe(this._id, PubSubTopics.SANITIZE_INTERNALS, () => {
                for(let ownerId in this._attachedAssets) {
                    let asset = this._attachedAssets[ownerId];
                    if(!asset) continue;
                    let parentAsset = asset.object.parent.asset;
                    if(parentAsset.constructor.assetType ==AssetTypes.INTERNAL){
                        this.detach(ownerId);
                    }
                }
                for(let ownerId in this._peerAttachedAssets) {
                    let asset = this._peerAttachedAssets[ownerId]['asset'];
                    let peer = this._peerAttachedAssets[ownerId]['peer'];
                    this.detachFromPeer(peer, asset, { ownerId: ownerId });
                }
            });
            PubSub.subscribe(this._id, assetType + '_UPDATED', (e) => {
                for(let ownerId in this._attachedAssets) {
                    if(this._attachedAssets[ownerId] == e.asset) {
                        if(e.fields.includes('visualEdit')
                                || e.fields.includes('parentId')) {
                            this._detachDeleted(ownerId);
                        }
                    }
                }
            });
        }
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, () => {
            for(let ownerId in this._attachedAssets) {
                this._detachDeleted(ownerId);
            }
        });
        //This should be in _addEventListeners, but convenient to allow XR users
        //when testing via emulator
        window.addEventListener('paste', (event) => { this._paste(event); });
    }

    _addEventListeners() {
        this._transformControls.addEventListener('mouseDown', () => {
            SessionHandler.disableOrbit();
            let instance = this._attachedAssets[global.deviceType];
            this._preTransformStates[instance.id]
                = instance.editorHelper.getObjectTransformation();
        });
        this._transformControls.addEventListener('mouseUp', () => {
            SessionHandler.enableOrbit();
            let instance = this._attachedAssets[global.deviceType];
            let instanceHelper = instance.editorHelper;
            instanceHelper.roundAttributes(true);
            let preState = this._preTransformStates[instance.id];
            let postState = instanceHelper.getObjectTransformation();
            instanceHelper.setObjectTransformation(preState, postState, false,
                false, true);
        });
        this._transformControls.addEventListener('objectChange', () => {
            if(global.renderer.info.render.frame % 3 == 0) {
                this._attachedAssets[global.deviceType].editorHelper
                    .roundAttributes();
            }
        });

        let placeButton = document.getElementById("place-button");
        placeButton.addEventListener('click', () => {
            this._placingObject[global.deviceType] =
                !this._placingObject[global.deviceType];
            this._clearSelected();
            if(this._placingObject[global.deviceType]) {
                placeButton.classList.add("selected");
                this._transformControls.detach();
            } else {
                document.getElementById(this._transformControls.mode +"-button")
                    .classList.add("selected");
                this._transformControls.attach(
                    this._attachedAssets[global.deviceType].object);
            }
        });

        let cloneButton = document.getElementById("clone-button");
        cloneButton.addEventListener('click', () => { this._clone(); });

        let deleteButton = document.getElementById("delete-button");
        deleteButton.addEventListener('click', () => {
            this._delete();
        });

        let closeButton = document.getElementById("close-button");
        closeButton.addEventListener('click', () => {
            this.detach();
        });

        for(let mode of MODES) {
            let button = document.getElementById(mode + "-button");
            button.addEventListener('click', () => {
                this._clearSelected();
                button.classList.add("selected");
                this._transformControls.setMode(mode);
                this._placingObject[global.deviceType] = false;
                this._transformControls.attach(
                    this._attachedAssets[global.deviceType].object);
            });
        }

        window.addEventListener('copy', (event) => { this._copy(event); });
        this._canvas.addEventListener('keydown', (event) => {
            if(event.code == "Backspace") {
                this._delete();
            } else if(event.code == 'Escape') {
                this.detach();
            }
        });
    }

    _clearSelected() {
        let buttons = document.querySelectorAll(BUTTON_QUERY);
        for(let button of buttons) {
            button.classList.remove('selected');
        }
    }

    _copy(e) {
        let ownerId = global.deviceType;
        let attachedAsset = this._attachedAssets[ownerId];
        if(attachedAsset) {
            let data = 'assetId:' + attachedAsset.assetId + ':instanceId:'
                + attachedAsset.id;
            e.clipboardData.setData('text/digitalbacon', data);
            e.preventDefault();
        }
    }

    _paste(e) {
        if(!global.isEditor) return;
        if(e.clipboardData.types.indexOf('Files') >= 0)
            this._pasteFiles(e.clipboardData.files);
        if(e.clipboardData.types.indexOf('text/digitalbacon') >= 0)
            this._pasteDigitalBaconData(e);
    }

    _pasteDigitalBaconData(e) {
        let data = e.clipboardData.getData('text/digitalbacon');
        if(!data.includes('assetId:') || !data.includes(':instanceId:')) return;
        let [ , , , instanceId] = data.split(":");
        let instance = ProjectHandler.getAsset(instanceId);
        let sessionInstance = ProjectHandler.getSessionAsset(instanceId);
        if(sessionInstance) {
            let clone = sessionInstance.clone();
            if(instance && !this._isDragging(instance))
                this._offsetClone(clone);
            e.preventDefault();
        }
    }

    _pasteFiles(files) {
        UploadHandler.uploadFiles(files, (assetIds) => {
            global.camera.getWorldPosition(vector3s[0]);
            global.camera.getWorldDirection(vector3s[1]);
            vector3s[1].normalize().multiplyScalar(11/12);
            vector3s[0].add(vector3s[1]);
            let position = vector3s[0].toArray();
            vector3s[0].set(0, 0, -1);
            vector3s[1].setY(0).normalize();
            quaternion.setFromUnitVectors(vector3s[0], vector3s[1]);
            euler.setFromQuaternion(quaternion);
            let rotation = euler.toArray();
            for(let assetId of assetIds) {
                let params = {
                    "assetId": assetId,
                    "position": position,
                    "rotation": rotation,
                    "visualEdit": true,
                };
                ProjectHandler.addNewAsset(assetId, params);
            }
        });
    }

    _clone(ownerId) {
        ownerId = ownerId || global.deviceType;
        let asset = this._attachedAssets[ownerId];
        if(asset) {
            let clone = asset.clone();
            if(!this._isDragging(asset)) this._offsetClone(clone);
        }
    }

    _offsetClone(instance) {
        let object = instance.object;
        vector3s[0].fromArray([0,1,0]);
        vector3s[1].setFromMatrixColumn(global.camera.matrixWorld, 0);
        vector3s[1].y = 0;
        vector3s[1].setLength(0.2);
        vector3s[1].applyAxisAngle(vector3s[0], -Math.PI / 4);
        object.position.add(vector3s[1]);
        instance.editorHelper.roundAttributes(true);
        instance.publishPosition();
    }

    _delete(ownerId) {
        ownerId = ownerId || global.deviceType;
        let asset = this._attachedAssets[ownerId];
        if(asset) {
            ProjectHandler.deleteAsset(asset);
        }
    }

    _checkPlacement(controller) {
        let ownerId = controller.owner.id;
        let raycaster = controller['raycaster'];
        raycaster.firstHitOnly = true;
        raycaster.far = Infinity;
        let isPressed = controller['isPressed'];
        let intersections = (global.deviceType == 'XR')
            ? this._intersectRelevantObjects(raycaster, ownerId)
            : raycaster.intersectObjects(ProjectHandler.getObjects(), true);
        let attachedAsset = this._attachedAssets[ownerId];
        if(intersections.length > 0) {
            controller['closestPoint'] = intersections[0].point;
            if(isPressed) {
                if(global.deviceType == 'XR') {
                    attachedAsset.attachTo(attachedAsset.parent, true);
                } else {
                    this._clearSelected();
                    document.getElementById(this._transformControls.mode
                        + "-button").classList.add("selected");
                    this._transformControls.attach(
                        attachedAsset.object);
                    this._placingObject[ownerId] = false;
                }
                let assetHelper = attachedAsset.editorHelper;
                let preState = assetHelper.getObjectTransformation();
                assetHelper.place(intersections[0]);
                if(global.deviceType == 'XR') {
                    this.detach(ownerId);
                    return;
                }
                assetHelper.roundAttributes(true);
                let postState = assetHelper.getObjectTransformation();
                assetHelper.setObjectTransformation(preState, postState, false,
                    false, true);
            }
        }
    }

    _scaleWithTwoHands() {
        let distance = global.userController.getDistanceBetweenHands();
        let factor = distance / this._initialScalingDistance;
        let asset;
        for(let ownerId in this._attachedAssets) {
            asset = this._attachedAssets[ownerId];
            break;
        }
        asset.object.scale.set(
            factor * this._initialScalingValues.x,
            factor * this._initialScalingValues.y,
            factor * this._initialScalingValues.z);

        if(global.renderer.info.render.frame % 6 == 0)
            asset.editorHelper._publish(['scale']);
    }

    _toolHandler(controller) {
        if(this._twoHandScaling) {
            this._scaleWithTwoHands();
            return true;
        } else if(global.deviceType != 'XR'
                && this._placingObject[controller.owner.id]) {
            this._checkPlacement(controller);
            return true;
        }
        return false;
    }

    //Slightly modified version of Raycaster::intersectObjects
    _intersectRelevantObjects(raycaster, ownerId) {
        let intersects = [];
        let objects = ProjectHandler.getObjects();
        let attachedObject = this._attachedAssets[ownerId].object;
        for(let i = 0, l = objects.length; i < l; i++) {
            if(objects[i] != attachedObject) {
                intersectObject(objects[i], raycaster, intersects, true);
            }
        }
        intersects.sort(ascSort);
        return intersects;
    }

    _otherOption(userController, ownerId) {
        let asset = ProjectHandler.getAsset(ownerId);
        let handedness = asset.handedness;
        let otherHand = Handedness.otherHand(handedness);
        let otherAsset = (asset.constructor.name == 'XRHand')
            ? userController.getHand(otherHand)
            : userController.getController(otherHand);
        if(otherAsset) return otherAsset.id;
        return null;
    }

    attach(asset, ownerId) {
        ownerId = ownerId || global.deviceType;
        let publishMessage = { instance: asset, ownerId: ownerId };
        //Don't allow more than 2 controllers/hands to grab objects for now
        //Almost no benefit allowing user to grab with hands and controllers
        //simultaineously as they'd be holding the controllers in their hands
        if(Object.keys(this._attachedAssets).length > 1) return;
        this._attachedAssets[ownerId] = asset;
        if(global.deviceType == 'XR') {
            this._placingObject[ownerId] = true;
            let otherOption = this._otherOption(global.userController, ownerId);
            if(asset == this._attachedAssets[otherOption]) {
                asset.attachTo(asset.parent, true);
                publishMessage.twoHandScaling = true;
                this._twoHandScaling = true;
                this._initialScalingDistance =
                    global.userController.getDistanceBetweenHands();
                this._initialScalingValues = asset.object.scale.clone();
            } else {
                this._preTransformStates[asset.id]
                    = asset.editorHelper.getObjectTransformation();
                //We CANNOT use asset.attach because we need to know who the
                //actual parent is
                ProjectHandler.getAsset(ownerId).object.attach(asset.object);
                asset.editorHelper.makeTranslucent();
            }
            publishMessage.position = asset.position;
            publishMessage.rotation = asset.rotation;
            UndoRedoHandler.disable(this._id);
        } else {
            asset.editorHelper._disableParam('position');
            asset.editorHelper._disableParam('rotation');
            asset.editorHelper._disableParam('scale');
            this._transformControls.attach(asset.object);
            document.getElementById("digital-bacon-transform-controls")
                .classList.remove("hidden");
            this._clearSelected();
            document.getElementById(this._transformControls.mode + "-button")
                .classList.add("selected");
        }
        PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED,publishMessage);
    }

    attachToPeer(peer, asset, message) {
        this._peerAttachedAssets[message.ownerId] = {
            asset: asset,
            peer: peer,
        };
        if(message.twoHandScaling) {
            asset.attachTo(asset.parent, true);
            asset.position = message.position;
            asset.rotation = message.rotation;
        } else {
            ProjectHandler.getAsset(message.ownerId).object.attach(
                asset.object);
            asset.position = message.position;
            asset.rotation = message.rotation;
        }
    }

    detach(ownerId) {
        ownerId = ownerId || global.deviceType;
        let assetHelper, preState, postState;
        let asset = this._attachedAssets[ownerId];
        if(!asset) return;
        let publishMessage = { instance: asset, ownerId: ownerId };
        if(global.deviceType == 'XR') {
            asset.attachTo(asset.parent, true);
            let otherOption = this._otherOption(global.userController, ownerId);
            if(this._attachedAssets[otherOption] == asset) {
                ProjectHandler.getAsset(otherOption).object.attach(
                    asset.object);
                publishMessage.twoHandScaling = true;
                this._twoHandScaling = false;
            } else {
                asset.editorHelper.returnTransparency();
                assetHelper = asset.editorHelper;
                assetHelper.roundAttributes(true);
                preState = this._preTransformStates[asset.id];
                postState = assetHelper.getObjectTransformation();
            }
            publishMessage.position = asset.position;
            publishMessage.rotation = asset.rotation;
            if(Object.keys(this._attachedAssets).length == 1)
                UndoRedoHandler.enable(this._id);
        } else {
            asset.editorHelper._enableParam('position');
            asset.editorHelper._enableParam('rotation');
            asset.editorHelper._enableParam('scale');
        }
        delete this._attachedAssets[ownerId];
        this._placingObject[ownerId] = false;
        this._transformControls.detach();
        document.getElementById("digital-bacon-transform-controls").classList
            .add("hidden");
        PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED,publishMessage);
        if(assetHelper && preState && postState)
            assetHelper.setObjectTransformation(preState, postState, false,
                false, true);
    }

    detachFromPeer(peer, asset, message) {
        delete this._peerAttachedAssets[message.ownerId];
        if(message.twoHandScaling) {
            let otherOption =this._otherOption(peer.controller,message.ownerId);
            ProjectHandler.getAsset(otherOption).object.attach(asset.object);
            asset.position = message.position;
            asset.rotation = message.rotation;
        } else {
            asset.attachTo(asset.parent, true);
            if(message.position) asset.position = message.position;
            if(message.rotation) asset.rotation = message.rotation;
        }
    }

    _detachDeleted(ownerId) {
        let asset = this._attachedAssets[ownerId];
        if(!asset) return;
        if(global.deviceType == 'XR') {
            let otherOption = this._otherOption(global.userController, ownerId);
            if(this._attachedAssets[otherOption] == asset) {
                this._twoHandScaling = false;
            } else {
                asset.attachTo(asset.parent);
                asset.editorHelper.returnTransparency();
                let preState = this._preTransformStates[asset.id];
                let assetHelper = asset.editorHelper;
                for(let param in preState) {
                    asset.object[param].fromArray(preState[param]);
                }
                assetHelper._publish(['position', 'rotation', 'scale']);
            }
            if(Object.keys(this._attachedAssets).length == 1)
                UndoRedoHandler.enable(this._id);
        } else {
            this._transformControls.detach();
            document.getElementById("digital-bacon-transform-controls")
                .classList.add("hidden");
            let preState = this._preTransformStates[asset.id];
            let assetHelper = asset.editorHelper;
            for(let param in preState) {
                asset.object[param].fromArray(preState[param]);
            }
            assetHelper._publish(['position', 'rotation', 'scale']);
        }
        delete this._attachedAssets[ownerId];
        this._placingObject[ownerId] = false;
    }

    initiateDrag() {
        let pointerPosition = InputHandler.getPointerPosition();
        let pointer = { x: pointerPosition.x, y: pointerPosition.y, button: 0 };
        let plane = this._transformControls._plane;
        plane.axis = 'XYZ';
        plane.updateMatrixWorld();
        plane.axis = null;
        this._transformControls.axis = 'XYZ';
        this._transformControls.pointerDown(pointer);
    }

    _isDragging(instance) {
        if(!instance) return this._transformControls.dragging;
        return this._transformControls.dragging
            && instance.object == this.getObject();
    }

    getObject() {
        return this._transformControls.object;
    }
}

//Copied from Raycaster.js
function ascSort(a, b) {
    return a.distance - b.distance;
}

//Copied from Raycaster.js
function intersectObject(object, raycaster, intersects, recursive) {
    if(object.layers.test(raycaster.layers)) {
        object.raycast(raycaster, intersects);
    }
    if(recursive === true) {
        const children = object.children;
        for(let i = 0, l = children.length; i < l; i++) {
            intersectObject(children[ i ], raycaster, intersects, true);
        }
    }
}

let transformControlsHandler = new TransformControlsHandler();
export default transformControlsHandler;
