/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import States from '/scripts/core/enums/InteractableStates.js';
import Hands from '/scripts/core/enums/Hands.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import CopyPasteControlsHandler from '/scripts/core/handlers/CopyPasteControlsHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import Box3Helper from '/scripts/core/helpers/Box3Helper.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
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
];
const OBJECT_TRANSFORM_PARAMS = ['position', 'rotation', 'scale'];
const FIELDS = [
    { "parameter": "position", "name": "Position", "type": Vector3Input },
    { "parameter": "rotation", "name": "Rotation", "type": EulerInput },
    { "parameter": "scale", "name": "Scale", "type": Vector3Input },
    { "parameter": "visualEdit", "name": "Visually Edit",
        "type": CheckboxInput },
];

export default class AssetHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.INSTANCE_UPDATED);
        this._object = asset.getObject();
        this._gripInteractables = {};
        this._pointerInteractables = {};
        for(let key of INTERACTABLE_KEYS) {
            this._pointerInteractables[key] = [];
            this._gripInteractables[key] = [];
        }
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._createInteractables();
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
                    ProjectHandler.deleteAssetInstance(this._asset);
                },
                () => {}
            );
            this._gripInteractables[HandTools.DELETE].push(deleteInteractable);
            deleteInteractable = new PointerInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAssetInstance(this._asset);
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
                () => {},
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
        } else {
            this._object.states = States;
            this._object.setState = (state) => {
                if(state == States.HOVERED
                    && this._object != TransformControlsHandler.getObject())
                {
                    this._boundingBox.setFromObject(this._object);
                    global.scene.add(this._boundingBoxObj);
                } else {
                    global.scene.remove(this._boundingBoxObj);
                }
            };
            let interactable = new PointerInteractable(this._object,
                () => {
                    TransformControlsHandler.attach(this._asset);
                },
                true,
                true
            );
            this._pointerInteractables[TOOL_AGNOSTIC].push(interactable);
        }
    }

    _updateVisualEdit(isVisualEdit, ignoreUndoRedo, ignorePublish) {
        if(isVisualEdit == this._asset.visualEdit) return;
        this._asset.visualEdit = isVisualEdit;
        if(isVisualEdit) {
            if(this._object.parent) {
                for(let key of INTERACTABLE_KEYS) {
                    let tool = (key != TOOL_AGNOSTIC) ? key : null;
                    GripInteractableHandler.addInteractables(
                        this._gripInteractables[key], tool);
                    PointerInteractableHandler.addInteractables(
                        this._pointerInteractables[key], tool);
                }
            }
        } else {
            for(let key of INTERACTABLE_KEYS) {
                let tool = (key != TOOL_AGNOSTIC) ? key : null;
                GripInteractableHandler.removeInteractables(
                    this._gripInteractables[key], tool);
                PointerInteractableHandler.removeInteractables(
                    this._pointerInteractables[key], tool);
            }
        }
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED,
                this._asset);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._updateVisualEdit(!isVisualEdit, true, ignorePublish);
                this._updateMenuField('visualEdit');
            }, () => {
                this._updateVisualEdit(isVisualEdit, true, ignorePublish);
                this._updateMenuField('visualEdit');
            });
        }
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
            this._updateMenuField(param);
            updated.push(param);
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED,this._asset);
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
                this._updateMenuField(param);
            }
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED,this._asset);
    }

    place(intersection) {
        let point = intersection.point;
        this._object.position.copy(point);
        this.roundAttributes(true);
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
                    onUpdate: (v) => { this._updateVisualEdit(v); },
                });
            } else {
                let input = this._createStandardInput(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }

    addToScene(scene) {
        if(!this._asset.visualEdit) return;
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.addInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.addInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    removeFromScene() {
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._boundingBoxObj);
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.removeInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.removeInteractables(
                this._pointerInteractables[key], tool);
        }
    }
}
