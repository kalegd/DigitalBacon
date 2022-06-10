/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

class MaterialsHandler {
    constructor() {
        this._materials = {};
        this._materialClassMap = {};
    }

    addMaterial(type, params, ignoreUndoRedo) {
        let material = new this._materialClassMap[type](params);
        this._addMaterial(material, ignoreUndoRedo);
        return material;
    }

    _addMaterial(material, ignoreUndoRedo) {
        this._materials[material.getId()] = material;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteMaterial(material, true);
            }, () => {
                this._addMaterial(material, true);
            });
        }
        material.undoDispose();
        PubSub.publish(this._id, PubSubTopics.MATERIAL_ADDED, material);
    }

    deleteMaterial(material, ignoreUndoRedo) {
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this._addMaterial(material, true);
            }, () => {
                this.deleteMaterial(material, true);
            });
        }
        material.dispose();
        delete this._materials[material.getId()];
        PubSub.publish(this._id, PubSubTopics.MATERIAL_DELETED, {
            material: material,
            undoRedoAction: undoRedoAction,
        });
    }

    load(materials) {
        if(!materials) return;
        for(let materialType in materials) {
            if(!(materialType in this._materialClassMap)) {
                console.error("Unrecognized material found");
                continue;
            }
            for(let params of materials[materialType]) {
                this.addMaterial(materialType, params, true);
            }
        }
    }

    registerMaterial(materialClass, materialType) {
        this._materialClassMap[materialType] = materialClass;
    }

    getMaterials() {
        return this._materials;
    }

    getMaterial(materialId) {
        return this._materials[materialId];
    }

    getType(materialId) {
        return this._materials[materialId].getMaterialType();
    }

    reset() {
        this._materials = {};
    }

    getMaterialsAssetIds() {
        let assetIds = new Set();
        //TODO: Fetch assetIds of each material
        return assetIds;
    }

    getMaterialsDetails() {
        let materialsDetails = {};
        for(let materialId in this._materials) {
            let material = this._materials[materialId];
            let type = material.getMaterialType();
            let params = material.exportParams();
            if(!(type in materialsDetails)) materialsDetails[type] = [];
            materialsDetails[type].push(params);
        }
        return materialsDetails;
    }
}

let materialsHandler = new MaterialsHandler();
export default materialsHandler;
