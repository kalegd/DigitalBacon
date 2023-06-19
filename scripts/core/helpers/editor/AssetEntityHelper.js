/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import UserController from '/scripts/core/assets/UserController.js';
import States from '/scripts/core/enums/InteractableStates.js';
import Hands from '/scripts/core/enums/Hands.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import CopyPasteControlsHandler from '/scripts/core/handlers/CopyPasteControlsHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import RotateHandler from '/scripts/core/handlers/hands/RotateHandler.js';
import ScaleHandler from '/scripts/core/handlers/hands/ScaleHandler.js';
import TranslateHandler from '/scripts/core/handlers/hands/TranslateHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import Box3Helper from '/scripts/core/helpers/Box3Helper.js';
import { disposeMaterial, fullDispose } from '/scripts/core/helpers/utils.module.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EulerInput from '/scripts/core/menu/input/EulerInput.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';
import * as THREE from 'three';

const OBJECT_TRANSFORM_PARAMS = ['position', 'rotation', 'scale'];
const TRS_HANDLERS = [{ handler: TranslateHandler, tool: HandTools.TRANSLATE },
    { handler: RotateHandler, tool: HandTools.ROTATE },
    { handler: ScaleHandler, tool: HandTools.SCALE },
];

export default class AssetEntityHelper extends EditorHelper {
    constructor(asset, updatedTopic) {
        super(asset, updatedTopic);
        this._object = asset.getObject();
        this._attachedPeers = new Set();
        this._gripActions = [];
        this._pointerActions = [];
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._overwriteAssetFunctions();
    }

    _addActions() {
        if(global.deviceType == "XR") {
            this._gripActions.push(
                this._asset.addGripAction((hand) => {
                    TransformControlsHandler.attach(this._asset, hand);
                }, (hand) => {
                    TransformControlsHandler.detach(hand);
                }, HandTools.EDIT));
            this._gripActions.push(
                this._asset.addGripAction((hand) => {
                    ProjectHandler.deleteAsset(this._asset);
                }, null, HandTools.DELETE));
            this._pointerActions.push(
                this._asset.addPointerAction(() => {
                    ProjectHandler.deleteAsset(this._asset);
                }, null, null, HandTools.DELETE));
            this._gripActions.push(
                this._asset.addGripAction((hand) => {
                    CopyPasteControlsHandler.copy(this._asset);
                }, null, HandTools.COPY_PASTE, Hands.LEFT));
            this._pointerActions.push(
                this._asset.addPointerAction(() => {
                    CopyPasteControlsHandler.copy(this._asset);
                }, null, null, HandTools.COPY_PASTE, Hands.LEFT));
            for(let handlerDetails of TRS_HANDLERS) {
                let handler = handlerDetails.handler;
                let tool = handlerDetails.tool;
                this._gripActions.push(
                    this._asset.addGripAction((hand) => {
                        handler.attach(UserController, hand, this._asset);
                    }, (hand) => {
                        handler.detach(UserController, hand);
                    }, tool));
            }
        } else {
            this._object.states = States;
            this._object.setState = (state) => {
                if(state == States.HOVERED) {
                    this._boundingBox.setFromObject(this._object);
                    global.scene.add(this._boundingBoxObj);
                } else {
                    if(state == States.SELECTED
                        && this._object == TransformControlsHandler.getObject()
                        && !TransformControlsHandler._isDragging())
                    {
                        TransformControlsHandler.initiateDrag();
                    }
                    global.scene.remove(this._boundingBoxObj);
                }
            };
            this._pointerActions.push(
                this._asset.addPointerAction(() => {
                    TransformControlsHandler.attach(this._asset);
                }));
        }
    }

    _removeActions() {
        for(let action of this._gripActions) {
            this._asset.removeGripAction(action.id);
        }
        this._gripActionsIds = [];
        for(let action of this._pointerActions) {
            this._asset.removePointerAction(action.id);
        }
        this._pointerActionsIds = [];
    }

    updateVisualEdit(isVisualEdit) {
        if(isVisualEdit == this._asset.visualEdit) return;
        this._asset.visualEdit = isVisualEdit;
        if(isVisualEdit) {
            if(this._object.parent && this._attachedPeers.size == 0) {
                this._addActions();
            }
        } else {
            this._removeActions();
        }
    }

    attachToPeer(peer, message) {
        this._attachedPeers.add(peer.id + ':' + message.option);
        if(message.isXR) {
            if(message.twoHandScaling) {
                global.scene.attach(this._object);
                this._asset.setPosition(message.position);
                this._asset.setRotation(message.rotation);
                return;
            } else {
                if(message.option in Hands && peer.controller) {
                    if(message.type == 'translate') {
                        TranslateHandler.attach(peer.controller, message.option,
                            this._asset, message.position);
                    } else if(message.type == 'rotate') {
                        RotateHandler.attach(peer.controller, message.option,
                            this._asset, message.rotation);
                    } else if(message.type == 'scale') {
                        ScaleHandler.attach(peer.controller, message.option,
                            this._asset, message.scale);
                    } else {
                        peer.controller.hands[message.option].attach(
                            this._object);
                        this._asset.setPosition(message.position);
                        this._asset.setRotation(message.rotation);
                    }
                }
            }
        }
        if(!this._asset.visualEdit) return;

        this._removeActions();
    }

    detachFromPeer(peer, message) {
        this._attachedPeers.delete(peer.id + ':' + message.option);
        if(message.isXR) {
            if(message.twoHandScaling) {
                let otherHand = Hands.otherHand(message.option);
                peer.controller.hands[otherHand].attach(this._object);
                this._asset.setPosition(message.position);
                this._asset.setRotation(message.rotation);
                return;
            } else {
                if(message.type == 'translate') {
                    TranslateHandler.detach(peer.controller, message.option,
                        message.position);
                } else if(message.type == 'rotate') {
                    RotateHandler.detach(peer.controller, message.option,
                        message.rotation);
                } else if(message.type == 'scale') {
                    ScaleHandler.detach(peer.controller, message.option,
                        message.scale);
                } else {
                    global.scene.attach(this._object);
                    this._asset.setPosition(message.position);
                    this._asset.setRotation(message.rotation);
                }
            }
        }
        if(!this._asset.visualEdit) return;

        this._addActions();
    }

    makeTranslucent() {
        this._object.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        for(let i = 0; i < node.material.length; i++) {
                            let mtrl = node.material[i];
                            let newMaterial = mtrl.clone();
                            makeMaterialTranslucent(newMaterial);
                            newMaterial.userData['oldMaterial'] = mtrl;
                            node.material[i] = newMaterial;
                        }
                    }
                    else {
                        let newMaterial = node.material.clone();
                        makeMaterialTranslucent(newMaterial);
                        newMaterial.userData['oldMaterial'] = node.material;
                        node.material = newMaterial;
                    }
                }
            }
        });
    }

    returnTransparency() {
        this._object.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        for(let i = 0; i < node.material.length; i++) {
                            let mtrl = node.material[i];
                            node.material[i] =
                                mtrl.userData['oldMaterial'];
                            disposeMaterial(mtrl);
                        }
                    }
                    else {
                        let oldMaterial = node.material;
                        node.material = node.material.userData['oldMaterial'];
                        disposeMaterial(oldMaterial);
                    }
                }
            }
        });
    }

    getObjectTransformation() {
        return {
            "position": this._object.position.toArray(),
            "rotation": this._object.rotation.toArray(),
            "scale": this._object.scale.toArray(),
        };
    }

    setObjectTransformation(oldValues, newValues, ignoreUndoRedo,
                            ignorePublish) {
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            let oldValue = (oldValues)
                ? oldValues[param]
                : this._object[param].toArray();
            let newValue = newValues[param];
            if(oldValue.reduce((a,v,i) => a && newValue[i] == v,true)) continue;
            this._object[param].fromArray(newValue);
            this.updateMenuField(param);
            updated.push(param);
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            this._publish(updated);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setObjectTransformation(null, oldValues, true,
                    ignorePublish);
            }, () => {
                this.setObjectTransformation(null, newValues, true,
                    ignorePublish);
            });
        }
    }

    roundAttributes(ignorePublish) {
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            if(this._object[param].roundWithPrecision(5)) {
                updated.push(param);
                this.updateMenuField(param);
            }
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            this._publish(updated);
    }

    place(intersection) {
        let point = intersection.point;
        this._object.position.copy(point);
        this.roundAttributes(true);
    }

    preview() {
        let params = this._asset.exportParams();
        params['visualEdit'] = false;
        delete params['id'];
        let instance = new this._asset.constructor(params);
        instance.makeTranslucent = this.makeTranslucent;
        instance.makeTranslucent();
        return instance;
    }

    _overwriteAssetFunctions() {
        this._asset._addToScene = this._asset.addToScene;
        this._asset._removeFromScene = this._asset.removeFromScene;
        this._asset.addToScene = (scene) => {
            this._asset._addToScene(scene);
            this.addToScene();
        };
        this._asset.removeFromScene = (scene) => {
            this._asset._removeFromScene();
            this.removeFromScene();
        };
        this._asset.setVisualEdit = (visualEdit) => {
            this.updateVisualEdit(visualEdit);
        }
    }

    addToScene(scene) {
        if(!this._asset.visualEdit || this._attachedPeers.size > 0) return;
        this._addActions();
    }

    removeFromScene() {
        this._attachedPeers.clear();
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._boundingBoxObj);
        this._removeActions();
    }

    static fields = [
        { "parameter": "position", "name": "Position", "type": Vector3Input },
        { "parameter": "rotation", "name": "Rotation", "type": EulerInput },
        { "parameter": "scale", "name": "Scale", "type": Vector3Input },
        { "parameter": "visualEdit", "name": "Visually Edit",
            "type": CheckboxInput },
    ];
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}

EditorHelperFactory.registerEditorHelper(AssetEntityHelper, AssetEntity);
