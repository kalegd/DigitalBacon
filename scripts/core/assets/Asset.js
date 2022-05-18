/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Entity from '/scripts/core/assets/Entity.js';
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
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { fullDispose, disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EulerInput from '/scripts/core/menu/input/EulerInput.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';
import * as THREE from 'three';

const TOOL_AGNOSTIC = "TOOL_AGNOSTIC";
const INTERACTABLE_KEYS = [
    "TOOL_AGNOSTIC",
    HandTools.EDIT,
    HandTools.COPY_PASTE,
    HandTools.DELETE,
];
const FIELDS = [
    { "name": "Position", "objParam": "position", "type": Vector3Input },
    { "name": "Rotation", "objParam": "rotation", "type": EulerInput },
    { "name": "Scale", "objParam": "scale", "type": Vector3Input },
    { "name": "Edit Visually", "type": CheckboxInput },
];

export default class Asset extends Entity {
    constructor(params = {}) {
        super();
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._id = params['id'] || this._id;
        this._assetId = params['assetId'];
        this._gripInteractables = {};
        this._pointerInteractables = {};
        for(let key of INTERACTABLE_KEYS) {
            this._pointerInteractables[key] = [];
            this._gripInteractables[key] = [];
        }

        this._name = ('name' in params) ? params['name'] : 'Object';
        let position = (params['position']) ? params['position'] : [0,0,0];
        let rotation = (params['rotation']) ? params['rotation'] : [0,0,0];
        let scale = (params['scale']) ? params['scale'] : [1,1,1];
        this.enableInteractables = params['enableInteractions'] || false;
        this._object.position.fromArray(position);
        this._object.rotation.fromArray(rotation);
        this._object.scale.fromArray(scale);
        this.roundAttributes();

        this._createInteractables();
    }

    _createMesh() {
        console.error("Asset._createMesh() should be overridden");
        return;
    }

    _createInteractables() {
        if(global.deviceType == "XR") {
            let interactable = new GripInteractable(this._object,
                (hand) => {
                    TransformControlsHandler.attach(this, hand);
                }, (hand) => {
                    TransformControlsHandler.detach(hand);
                }
            );
            this._gripInteractables[HandTools.EDIT].push(interactable);
            let deleteInteractable = new GripInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAssetInstance(this);
                },
                () => {}
            );
            this._gripInteractables[HandTools.DELETE].push(deleteInteractable);
            deleteInteractable = new PointerInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAssetInstance(this);
                },
                true,
                true
            );
            this._pointerInteractables[HandTools.DELETE]
                .push(deleteInteractable);
            let copyInteractable = new GripInteractable(this._object,
                (hand) => {
                    CopyPasteControlsHandler.copy(this);
                },
                () => {},
                Hands.LEFT
            );
            this._gripInteractables[HandTools.COPY_PASTE]
                .push(copyInteractable);
            copyInteractable = new PointerInteractable(this._object,
                (hand) => {
                    CopyPasteControlsHandler.copy(this);
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
                    TransformControlsHandler.attach(this);
                },
                true,
                true
            );
            this._pointerInteractables[TOOL_AGNOSTIC].push(interactable);
        }
    }

    _updateInteractable(isInteractable) {
        if(isInteractable == this.enableInteractables) return;
        this.enableInteractables = isInteractable;
        if(isInteractable) {
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
    }

    makeTranslucent() {
        this._object.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                if (node.material) {
                    if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                        node.material.materials.forEach(function (mtrl, idx) {
                            let newMaterial = mtrl.clone();
                            makeMaterialTranslucent(newMaterial);
                            newMaterial.userData['oldMaterial'] = mtrl;
                            node.material.materials[idx] = newMaterial;
                        });
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
                    if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                        node.material.materials.forEach(function (mtrl, idx) {
                            node.material.materials[idx] =
                                mtrl.userData['oldMaterial'];
                            disposeMaterial(mtrl);
                        });
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

    roundAttributes() {
        this._object.position.roundWithPrecision(5);
        this._object.rotation.roundWithPrecision(5);
        this._object.scale.roundWithPrecision(5);
    }

    _fetchCloneParams(enableInteractablesOverride) {
        let params = this.exportParams();
        let enableInteractables = (enableInteractablesOverride != null)
            ? enableInteractablesOverride
            : this.enableInteractables;
        let position = this._object.getWorldPosition(vector3s[0]).toArray();
        let rotation = euler.setFromQuaternion(
            this._object.getWorldQuaternion(quaternion)).toArray();
        params['enableInteractions'] = enableInteractables;
        params['position'] = position;
        params['rotation'] = rotation;
        delete params['id'];
        return params;
    }

    preview() {
        let params = this.exportParams();
        params['enableInteractions'] = false;
        params['isPreview'] = true;
        delete params['id'];
        return new this.constructor(params);
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
            "assetId": this._assetId,
            "position": this._object.position.toArray(),
            "rotation": this._object.rotation.toArray(),
            "scale": this._object.scale.toArray(),
            "enableInteractions": this.enableInteractables,
        };
    }

    setFromParams(params) {
        this._object.position.fromArray(params["position"]);
        this._object.rotation.fromArray(params["rotation"]);
        this._object.scale.fromArray(params["scale"]);
        this._updateInteractable(params["enableInteractions"]);
        PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
    }

    getMenuFields(fields) {
        if(this._menuFields) return this._menuFields;

        let menuFieldsMap = this._getMenuFieldsMap();
        let menuFields = [];
        for(let field of fields) {
            if(field.name in menuFieldsMap) {
                menuFields.push(menuFieldsMap[field.name]);
            }
        }
        this._menuFields = menuFields;
        return menuFields;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = {};
        for(let field of FIELDS) {
            let params = {};
            if(field.type == CheckboxInput) {
                params['title'] = field.name;
                params['initialValue'] = this.enableInteractables;
                params['getFromSource'] =
                    () => { return this.enableInteractables; };
                params['setToSource'] = (v) => { this._updateInteractable(v); };
            } else if(field.type == EulerInput) {
                params['title'] = field.name;
                params['euler'] = this._object[field.objParam];
            } else if(field.type == Vector3Input) {
                params['title'] = field.name;
                params['vector3'] = this._object[field.objParam];
            }
            let menuField = new field.type(params)
            menuFieldsMap[field.name] = menuField;
        }
        return menuFieldsMap;
    }

    place(intersection) {
        let point = intersection.point;
        this._object.position.copy(point);
        this.roundAttributes();
    }

    addToScene(scene) {
        scene.add(this._object);
        if(!this.enableInteractables) return;
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.addInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.addInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    removeFromScene() {
        this._object.parent.remove(this._object);
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._object);
        fullDispose(this._boundingBoxObj);
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.removeInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.removeInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    getId() {
        return this._id;
    }

    getAssetId() {
        return this._assetId;
    }

    getName() {
        return this._name;
    }

    setName(newName, isUndoRedo) {
        if(newName == null || this._name == newName) return;
        let oldName = this._name;
        this._name = newName;
        PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        if(!isUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setName(oldName, true);
            }, () => {
                this.setName(newName, true);
            });
        }
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}
