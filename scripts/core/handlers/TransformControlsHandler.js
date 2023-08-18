/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import UploadHandler from '/scripts/core/handlers/UploadHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { TransformControls } from '/node_modules/three/examples/jsm/controls/TransformControls.js';
import * as THREE from 'three';

const MODES = ['translate', 'rotate', 'scale'];
const MODE_TO_OBJECT_PARAM = {
    translate: 'position',
    rotate: 'rotation',
    scale: 'scale'
};

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
        let tool = (global.deviceType == 'XR') ? HandTools.EDIT : null;
        PointerInteractableHandler.registerToolHandler(tool, (controller) => {
            return this._toolHandler(controller);
        });
        if(global.deviceType != 'XR') {
            scene.add(this._transformControls);
            this._addEventListeners();
        }
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (handTool) => {
            if(handTool == HandTools.EDIT) return;
            for(let option in this._attachedAssets) {
                this.detach(option);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.MENU_FIELD_FOCUSED, (message)=>{
            if(message['targetOnlyMenu']) return;
            for(let option in this._attachedAssets) {
                this.detach(option);
            }
        });
        for(let assetType in AssetEntityTypes) {
            PubSub.subscribe(this._id, assetType + '_DELETED', (e) => {
                for(let option in this._attachedAssets) {
                    if(this._attachedAssets[option] == e.asset) {
                        this._detachDeleted(option);
                    }
                }
            });
            PubSub.subscribe(this._id, PubSubTopics.SANITIZE_INTERNALS, () => {
                for(let option in this._attachedAssets) {
                    let asset = this._attachedAssets[option];
                    if(!asset) continue;
                    let parentAsset = asset.getObject().parent.asset;
                    if(parentAsset.constructor.assetType ==AssetTypes.INTERNAL){
                        this.detach(option);
                    }
                }
                for(let option in this._peerAttachedAssets) {
                    let asset = this._peerAttachedAssets[option]['asset'];
                    let peer = this._peerAttachedAssets[option]['peer'];
                    this.detachFromPeer(peer, asset, { option: option });
                }
            });
            PubSub.subscribe(this._id, assetType + '_UPDATED', (e) => {
                for(let option in this._attachedAssets) {
                    if(this._attachedAssets[option] == e.asset) {
                        if(e.fields.includes('visualEdit'))
                            this._detachDeleted(option);
                    }
                }
            });
        }
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            for(let option in this._attachedAssets) {
                this._detachDeleted(option);
            }
        });
    }

    _addEventListeners() {
        this._transformControls.addEventListener('mouseDown', () => {
            SessionHandler.disableOrbit();
            let instance = this._attachedAssets[global.deviceType];
            this._preTransformStates[instance.getId()]
                = instance.editorHelper.getObjectTransformation();
        });
        this._transformControls.addEventListener('mouseUp', () => {
            SessionHandler.enableOrbit();
            let instance = this._attachedAssets[global.deviceType];
            let instanceHelper = instance.editorHelper;
            instanceHelper.roundAttributes(true);
            let preState = this._preTransformStates[instance.getId()];
            let postState = instanceHelper.getObjectTransformation();
            instanceHelper.setObjectTransformation(preState, postState);
        });
        this._transformControls.addEventListener('objectChange', () => {
            if(global.renderer.info.render.frame % 6 == 0) {
                this._attachedAssets[global.deviceType].editorHelper
                    .roundAttributes();
            }
        });

        let placeButton = document.getElementById("place-button");
        placeButton.addEventListener('click', () => {
            this._placingObject[global.deviceType] =
                !this._placingObject[global.deviceType];
            $("#transform-controls > button").removeClass("selected");
            if(this._placingObject[global.deviceType]) {
                $(placeButton).addClass("selected");
                this._transformControls.detach();
            } else {
                $('#' + this._transformControls.mode + "-button")
                    .addClass("selected");
                this._transformControls.attach(
                    this._attachedAssets[global.deviceType].getObject());
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
                $("#transform-controls > button").removeClass("selected");
                $(button).addClass("selected");
                this._transformControls.setMode(mode);
                this._placingObject[global.deviceType] = false;
                this._transformControls.attach(
                    this._attachedAssets[global.deviceType].getObject());
            });
        }

        window.addEventListener('copy', (event) => { this._copy(event); });
        window.addEventListener('paste', (event) => { this._paste(event); });
        this._canvas.addEventListener('keydown', (event) => {
            if(event.code == "Backspace") {
                this._delete();
            } else if(event.code == 'Escape') {
                this.detach();
            }
        });
    }

    _copy(e) {
        let option = global.deviceType;
        let attachedAsset = this._attachedAssets[option];
        if(attachedAsset) {
            let data = 'assetId:' + attachedAsset.getAssetId() + ':instanceId:'
                + attachedAsset.getId();
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
        let [ , assetId, , instanceId] = data.split(":");
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
                let type = LibraryHandler.getType(assetId);
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

    _clone(option) {
        option = option || global.deviceType
        let asset = this._attachedAssets[option];
        if(asset) {
            let clone = asset.clone();
            if(!this._isDragging(asset)) this._offsetClone(clone);
        }
    }

    _offsetClone(instance) {
        let object = instance.getObject();
        vector3s[0].fromArray([0,1,0]);
        vector3s[1].setFromMatrixColumn(global.camera.matrixWorld, 0);
        vector3s[1].y = 0;
        vector3s[1].setLength(0.2);
        vector3s[1].applyAxisAngle(vector3s[0], -Math.PI / 4);
        object.position.add(vector3s[1]);

        instance.editorHelper.roundAttributes(true);
    }

    _delete(option) {
        option = option || global.deviceType
        let asset = this._attachedAssets[option];
        if(asset) {
            ProjectHandler.deleteAsset(asset);
        }
    }

    _checkPlacement(controller) {
        let option = controller.option;
        let raycaster = controller['raycaster'];
        raycaster.firstHitOnly = true;
        raycaster.far = Infinity;
        let isPressed = controller['isPressed'];
        let intersections = (global.deviceType == 'XR')
            ? this._intersectRelevantObjects(raycaster, option)
            : raycaster.intersectObjects(ProjectHandler.getObjects(), true);
        let attachedAsset = this._attachedAssets[option];
        if(intersections.length > 0) {
            controller['closestPoint'] = intersections[0].point;
            if(isPressed) {
                if(global.deviceType == 'XR') {
                    attachedAsset.attachTo(attachedAsset.parent, true);
                } else {
                    $("#transform-controls > button")
                        .removeClass("selected");
                    $('#' + this._transformControls.mode + "-button")
                        .addClass("selected");
                    this._transformControls.attach(
                        attachedAsset.getObject());
                    this._placingObject[option] = false;
                }
                let assetHelper = attachedAsset.editorHelper;
                let preState = assetHelper.getObjectTransformation();
                assetHelper.place(intersections[0]);
                if(global.deviceType == 'XR') {
                    this.detach(option);
                    return;
                }
                assetHelper.roundAttributes(true);
                let postState = assetHelper.getObjectTransformation();
                assetHelper.setObjectTransformation(preState, postState);
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
        asset.getObject().scale.set(
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
                && this._placingObject[controller.option]) {
            this._checkPlacement(controller);
            return true;
        }
        return false;
    }

    //Slightly modified version of Raycaster::intersectObjects
    _intersectRelevantObjects(raycaster, option) {
        let intersects = [];
        let objects = ProjectHandler.getObjects();
        let attachedObject = this._attachedAssets[option].getObject();
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
        let handedness = asset.getHandedness();
        let otherHand = Handedness.otherHand(handedness);
        let otherAsset = (asset.constructor.name == 'XRHand')
            ? userController.getHand(otherHand)
            : userController.getController(otherHand);
        if(otherAsset) return otherAsset.getId();
        return null;
    }

    attach(asset, option) {
        option = option || global.deviceType;
        let publishMessage = { instance: asset, option: option };
        //Don't allow more than 2 controllers/hands to grab objects for now
        //Almost no benefit allowing user to grab with hands and controllers
        //simultaineously as they'd be holding the controllers in their hands
        if(Object.keys(this._attachedAssets).length > 1) return;
        this._attachedAssets[option] = asset;
        if(global.deviceType == 'XR') {
            this._placingObject[option] = true;
            let otherOption = this._otherOption(global.userController, option);
            if(asset == this._attachedAssets[otherOption]) {
                asset.attachTo(asset.parent, true);
                publishMessage.twoHandScaling = true;
                this._twoHandScaling = true;
                this._initialScalingDistance =
                    global.userController.getDistanceBetweenHands();
                this._initialScalingValues = asset.getObject().scale.clone();
            } else {
                this._preTransformStates[asset.getId()]
                    = asset.editorHelper.getObjectTransformation();
                //We CANNOT use asset.attach because we need to know who the
                //actual parent is
                ProjectHandler.getAsset(option).getObject().attach(
                    asset.getObject());
                asset.editorHelper.makeTranslucent();
            }
            publishMessage.position = asset.getPosition();
            publishMessage.rotation = asset.getRotation();
            UndoRedoHandler.disable(this._id);
        } else {
            this._transformControls.attach(asset.getObject());
            $("#transform-controls").removeClass("hidden");
            $("#transform-controls > button").removeClass("selected");
            $('#' + this._transformControls.mode + "-button")
                .addClass("selected");
        }
        PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED,publishMessage);
    }

    attachToPeer(peer, asset, message) {
        this._peerAttachedAssets[message.option] = {
            asset: asset,
            peer: peer,
        };
        if(message.twoHandScaling) {
            asset.attachTo(asset.parent, true);
            asset.setPosition(message.position);
            asset.setRotation(message.rotation);
        } else {
            ProjectHandler.getAsset(message.option).getObject().attach(
                asset.getObject());
            asset.setPosition(message.position);
            asset.setRotation(message.rotation);
        }
    }

    detach(option) {
        option = option || global.deviceType;
        let assetHelper, preState, postState;
        let asset = this._attachedAssets[option];
        if(!asset) return;
        let publishMessage = { instance: asset, option: option };
        if(global.deviceType == 'XR') {
            asset.attachTo(asset.parent, true);
            let otherOption = this._otherOption(global.userController, option);
            if(this._attachedAssets[otherOption] == asset) {
                ProjectHandler.getAsset(otherOption).getObject().attach(
                    asset.getObject());
                publishMessage.twoHandScaling = true;
                this._twoHandScaling = false;
            } else {
                asset.editorHelper.returnTransparency();
                assetHelper = asset.editorHelper;
                assetHelper.roundAttributes(true);
                preState = this._preTransformStates[asset.getId()];
                postState = assetHelper.getObjectTransformation();
            }
            publishMessage.position = asset.getPosition();
            publishMessage.rotation = asset.getRotation();
            if(Object.keys(this._attachedAssets).length == 1)
                UndoRedoHandler.enable(this._id);
        }
        delete this._attachedAssets[option];
        this._placingObject[option] = false;
        this._transformControls.detach();
        $("#transform-controls").addClass("hidden");
        PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED,publishMessage);
        if(assetHelper && preState && postState)
            assetHelper.setObjectTransformation(preState, postState);
    }

    detachFromPeer(peer, asset, message) {
        delete this._peerAttachedAssets[message.option];
        if(message.twoHandScaling) {
            let otherOption = this._otherOption(peer.controller,message.option);
            ProjectHandler.getAsset(otherOption).getObject().attach(
                asset.getObject());
            asset.setPosition(message.position);
            asset.setRotation(message.rotation);
        } else {
            asset.attachTo(asset.parent, true);
            if(message.position) asset.setPosition(message.position);
            if(message.rotation) asset.setRotation(message.rotation);
        }
    }

    _detachDeleted(option) {
        let asset = this._attachedAssets[option];
        if(!asset) return;
        if(global.deviceType == 'XR') {
            let otherOption = this._otherOption(global.userController, option);
            if(this._attachedAssets[otherOption] == asset) {
                this._twoHandScaling = false;
            } else {
                asset.attachTo(asset.parent);
                asset.editorHelper.returnTransparency();
                let preState = this._preTransformStates[asset.getId()];
                let assetHelper = asset.editorHelper;
                for(let param in preState) {
                    asset.getObject()[param].fromArray(preState[param]);
                }
                assetHelper._publish(['position', 'rotation', 'scale']);
            }
            if(Object.keys(this._attachedAssets).length == 1)
                UndoRedoHandler.enable(this._id);
        } else {
            this._transformControls.detach();
            $("#transform-controls").addClass("hidden");
            let preState = this._preTransformStates[global.deviceType];
            let assetHelper = asset.editorHelper;
            for(let param in preState) {
                asset.getObject()[param].fromArray(preState[param]);
            }
            assetHelper._publish(['position', 'rotation', 'scale']);
        }
        delete this._attachedAssets[option];
        this._placingObject[option] = false;
    }

    initiateDrag(option) {
        option = option || global.deviceType;
        let asset = this._attachedAssets[option];
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
            && instance.getObject() == this.getObject();
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
