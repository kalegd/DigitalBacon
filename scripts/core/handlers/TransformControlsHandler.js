/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import UserController from '/scripts/core/assets/UserController.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import Hands from '/scripts/core/enums/Hands.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
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
        this._placingObject = {};
        this._preTransformStates = {};
        this._id = uuidv4();
        if(global.deviceType != 'XR') {
            scene.add(this._transformControls);
            this._addEventListeners();
        }
        PubSub.subscribe(this._id, PubSubTopics.HAND_TOOLS_SWITCH, (handTool)=>{
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
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DELETED, (e) => {
            for(let option in this._attachedAssets) {
                if(this._attachedAssets[option] == e.instance) {
                    this.detach(option);
                    return;
                }
            }
        });
    }

    _addEventListeners() {
        this._transformControls.addEventListener('mouseDown', () => {
            SessionHandler.disableOrbit();
            this._preTransformStates[global.deviceType]
                = this._attachedAssets[global.deviceType].getEditorHelper()
                    .getObjectTransformation();
        });
        this._transformControls.addEventListener('mouseUp', () => {
            SessionHandler.enableOrbit();
            let instance = this._attachedAssets[global.deviceType];
            let instanceHelper = instance.getEditorHelper();
            instanceHelper.roundAttributes(true);
            let preState = this._preTransformStates[global.deviceType];
            let postState = instanceHelper.getObjectTransformation();
            instanceHelper.setObjectTransformation(preState, postState);
        });
        this._transformControls.addEventListener('objectChange', () => {
            if(global.renderer.info.render.frame % 6 == 0) {
                this._attachedAssets[global.deviceType].getEditorHelper()
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
            this._placingObject[global.deviceType] = false;
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
            if(event.code == "Backspace") this._delete();
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
        if(e.clipboardData.types.indexOf('Files') >= 0)
            this._pasteFiles(e.clipboardData.files);
        if(e.clipboardData.types.indexOf('text/digitalbacon') >= 0)
            this._pasteDigitalBaconData(e);
    }

    _pasteDigitalBaconData(e) {
        let data = e.clipboardData.getData('text/digitalbacon');
        if(!data.includes('assetId:') || !data.includes(':instanceId:')) return;
        let [ , assetId, , instanceId] = data.split(":");
        let instances = ProjectHandler.getInstancesForAssetId(assetId);
        let instance = instances[instanceId];
        //Maybe we should store parameters in case object has been deleted so we
        //can still paste it back? Definitily! But later...
        if(instance) {
            let clone = instance.clone();
            if(!this._isDragging(instance)) this._offsetClone(clone);
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
            vector3s[0].set(0, 0, 1);
            vector3s[1].setY(0).normalize();
            quaternion.setFromUnitVectors(vector3s[0], vector3s[1]);
            euler.setFromQuaternion(quaternion);
            let rotation = euler.toArray();
            for(let assetId of assetIds) {
                let type = LibraryHandler.getType(assetId);
                if(type == AssetTypes.IMAGE) {
                    ProjectHandler.addImage({
                        "assetId": assetId,
                        "position": position,
                        "rotation": rotation,
                        "doubleSided": true,
                        "transparent": true,
                        "visualEdit": true,
                    });
                } else if(type == AssetTypes.MODEL) {
                    ProjectHandler.addGLTF({
                        "assetId": assetId,
                        "position": position,
                        "rotation": rotation,
                        "visualEdit": true,
                    });
                }
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
        object.worldToLocal(vector3s[1]);
        object.position.add(vector3s[1]);

        instance.getEditorHelper().roundAttributes(true);
    }

    _delete(option) {
        option = option || global.deviceType
        let asset = this._attachedAssets[option];
        if(asset) {
            ProjectHandler.deleteAssetInstance(asset);
        }
    }

    checkPlacement(controllers) {
        for(let option in controllers) {
            let controller = controllers[option];
            let raycaster = controller['raycaster'];
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
                        UserController.hands[option]
                            .remove(attachedAsset.getObject());
                    } else {
                        $("#transform-controls > button")
                            .removeClass("selected");
                        $('#' + this._transformControls.mode + "-button")
                            .addClass("selected");
                        this._transformControls.attach(
                            attachedAsset.getObject());
                        this._placingObject[option] = false;
                    }
                    let assetHelper = attachedAsset.getEditorHelper();
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
    }

    scaleWithTwoHands() {
        let distance = UserController.getDistanceBetweenHands();
        let factor = distance / this._initialScalingDistance;
        this._attachedAssets[Hands.LEFT].getObject().scale.set(
            factor * this._initialScalingValues.x,
            factor * this._initialScalingValues.y,
            factor * this._initialScalingValues.z);
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

    _getOtherHand(hand) {
        if(hand == Hands.RIGHT) {
            return Hands.LEFT;
        } else if(hand == Hands.LEFT) {
            return Hands.RIGHT;
        }
        return null;
    }

    attach(asset, option) {
        option = option || global.deviceType;
        PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
            instance: asset,
            option: option,
        });
        this._attachedAssets[option] = asset;
        if(global.deviceType == 'XR') {
            this._placingObject[option] = true;
            let otherOption = this._getOtherHand(option);
            if(asset == this._attachedAssets[otherOption]) {
                UserController.hands[option].remove(asset.getObject());
                UserController.hands[otherOption].remove(asset.getObject());
                this._twoHandScaling = true;
                this._initialScalingDistance =
                    UserController.getDistanceBetweenHands();
                this._initialScalingValues = asset.getObject().scale.clone();
            } else {
                this._preTransformStates[asset.getId()]
                    = asset.getEditorHelper().getObjectTransformation();
                UserController.hands[option].attach(asset.getObject());
                asset.makeTranslucent();
            }
            UndoRedoHandler.disable(this._id);
        } else {
            this._transformControls.attach(asset.getObject());
            $("#transform-controls").removeClass("hidden");
            $("#transform-controls > button").removeClass("selected");
            $('#' + this._transformControls.mode + "-button")
                .addClass("selected");
        }
    }

    detach(option) {
        option = option || global.deviceType;
        let asset = this._attachedAssets[option];
        if(!asset) return;
        PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
            instance: asset,
            option: option,
        });
        if(global.deviceType == 'XR') {
            UserController.hands[option].remove(asset.getObject());
            let otherOption = this._getOtherHand(option);
            if(this._attachedAssets[otherOption] == asset) {
                UserController.hands[otherOption].attach(asset.getObject());
                this._twoHandScaling = false;
            } else {
                asset.returnTransparency();
                let assetHelper = asset.getEditorHelper();
                assetHelper.roundAttributes(true);
                let preState = this._preTransformStates[asset.getId()];
                let postState = assetHelper.getObjectTransformation();
                assetHelper.setObjectTransformation(preState, postState);
            }
            if(Object.keys(this._attachedAssets).length == 1)
                UndoRedoHandler.enable(this._id);
        }
        delete this._attachedAssets[option];
        this._placingObject[option] = false;
        this._transformControls.detach();
        $("#transform-controls").addClass("hidden");
    }

    _isDragging(instance) {
        if(!instance) return this._transformControls.dragging;
        return this._transformControls.dragging
            && instance.getObject() == this.getObject();
    }

    getObject() {
        return this._transformControls.object;
    }

    isPlacingObject(option) {
        return this._placingObject[option || global.deviceType];
    }

    isTwoHandScaling() {
        return this._twoHandScaling;
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
