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

const TOOL_AGNOSTIC = "TOOL_AGNOSTIC";
const INTERACTABLE_KEYS = [
    TOOL_AGNOSTIC,
    HandTools.EDIT,
    HandTools.COPY_PASTE,
    HandTools.DELETE,
    HandTools.TRANSLATE,
    HandTools.ROTATE,
    HandTools.SCALE,
];
const OBJECT_TRANSFORM_PARAMS = ['position', 'rotation', 'scale'];
const FIELDS = [
    { "parameter": "position", "name": "Position", "type": Vector3Input },
    { "parameter": "rotation", "name": "Rotation", "type": EulerInput },
    { "parameter": "scale", "name": "Scale", "type": Vector3Input },
    { "parameter": "visualEdit", "name": "Visually Edit",
        "type": CheckboxInput },
];

export default class AssetEntityHelper extends EditorHelper {
    constructor(asset, updatedTopic) {
        super(asset, updatedTopic);
        this._object = asset.getObject();
        this._attachedPeers = new Set();
        this._gripInteractables = {};
        this._pointerInteractables = {};
        for(let key of INTERACTABLE_KEYS) {
            this._pointerInteractables[key] = [];
            this._gripInteractables[key] = [];
        }
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._createInteractables();
        this._overwriteAssetFunctions();
    }

    _createInteractables() {
        if(global.deviceType == "XR") {
            let interactable = new GripInteractable(this._object,
                (hand) => {
                    TransformControlsHandler.attach(this._asset, hand);
                }, (hand) => {
                    TransformControlsHandler.detach(hand);
                }
            );
            this._gripInteractables[HandTools.EDIT].push(interactable);
            let deleteInteractable = new GripInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAsset(this._asset);
                }
            );
            this._gripInteractables[HandTools.DELETE].push(deleteInteractable);
            deleteInteractable = new PointerInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAsset(this._asset);
                },
                true,
                true
            );
            this._pointerInteractables[HandTools.DELETE]
                .push(deleteInteractable);
            let copyInteractable = new GripInteractable(this._object,
                (hand) => {
                    CopyPasteControlsHandler.copy(this._asset);
                },
                null,
                null,
                Hands.LEFT
            );
            this._gripInteractables[HandTools.COPY_PASTE]
                .push(copyInteractable);
            copyInteractable = new PointerInteractable(this._object,
                (hand) => {
                    CopyPasteControlsHandler.copy(this._asset);
                },
                true,
                true,
                Hands.LEFT
            );
            this._pointerInteractables[HandTools.COPY_PASTE]
                .push(copyInteractable);
            let translateInteractable = new GripInteractable(this._object,
                (hand) => {
                    TranslateHandler.attach(UserController, hand, this._asset);
                },
                (hand) => {
                    TranslateHandler.detach(UserController, hand);
                },
            );
            this._gripInteractables[HandTools.TRANSLATE]
                .push(translateInteractable);
            let rotateInteractable = new GripInteractable(this._object,
                (hand) => {
                    RotateHandler.attach(UserController, hand, this._asset);
                },
                (hand) => {
                    RotateHandler.detach(UserController, hand);
                },
            );
            this._gripInteractables[HandTools.ROTATE]
                .push(rotateInteractable);
            let scaleInteractable = new GripInteractable(this._object,
                (hand) => {
                    ScaleHandler.attach(UserController, hand, this._asset);
                },
                (hand) => {
                    ScaleHandler.detach(UserController, hand);
                },
            );
            this._gripInteractables[HandTools.SCALE]
                .push(scaleInteractable);
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
            let interactable = new PointerInteractable(this._object,
                () => {
                    TransformControlsHandler.attach(this._asset);
                },
                false,
            );
            this._pointerInteractables[TOOL_AGNOSTIC].push(interactable);
        }
    }

    _addInteractables() {
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.addInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.addInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    _removeInteractables() {
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.removeInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.removeInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    updateVisualEdit(isVisualEdit, ignoreUndoRedo, ignorePublish) {
        if(isVisualEdit == this._asset.visualEdit) return;
        this._asset.visualEdit = isVisualEdit;
        if(isVisualEdit) {
            if(this._object.parent && this._attachedPeers.size == 0) {
                this._addInteractables();
            }
        } else {
            this._removeInteractables();
        }
        if(!ignorePublish)
            this._publish(['visualEdit']);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.updateVisualEdit(!isVisualEdit, true, ignorePublish);
                this.updateMenuField('visualEdit');
            }, () => {
                this.updateVisualEdit(isVisualEdit, true, ignorePublish);
                this.updateMenuField('visualEdit');
            });
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

        this._removeInteractables();
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

        this._addInteractables();
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

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) continue;
            if(field.type == CheckboxInput) {
                menuFieldsMap[field.parameter] = new CheckboxInput({
                    title: field.name,
                    initialValue: this._asset.visualEdit,
                    getFromSource: () => { return this._asset.visualEdit; },
                    onUpdate: (v) => { this.updateVisualEdit(v); },
                });
            } else {
                let input = this._createStandardInput(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
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
            this.updateVisualEdit(visualEdit, true, true);
        }
    }

    addToScene(scene) {
        if(!this._asset.visualEdit || this._attachedPeers.size > 0) return;
        this._addInteractables();
    }

    removeFromScene() {
        this._attachedPeers.clear();
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._boundingBoxObj);
        this._removeInteractables();
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}

EditorHelperFactory.registerEditorHelper(AssetEntityHelper, AssetEntity);
