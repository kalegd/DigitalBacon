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
        this._sessionMaterials = {};
    }

    addNewMaterial(type, params, ignoreUndoRedo, ignorePublish) {
        let material = new this._materialClassMap[type](params);
        this.addMaterial(material, ignoreUndoRedo, ignorePublish);
        return material;
    }

    addMaterial(material, ignoreUndoRedo, ignorePublish) {
        if(this._materials[material.getId()]) return;
        this._materials[material.getId()] = material;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteMaterial(material, true, ignorePublish);
            }, () => {
                this.addMaterial(material, true, ignorePublish);
            });
        }
        material.undoDispose();
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.MATERIAL_ADDED, material);
    }

    deleteMaterial(material, ignoreUndoRedo, ignorePublish) {
        if(!(material.getId() in this._materials)) return;
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this.addMaterial(material, true, ignorePublish);
            }, () => {
                this.deleteMaterial(material, true, ignorePublish);
            });
        }
        material.dispose();
        delete this._materials[material.getId()];
        if(ignorePublish) return;
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
                this.addNewMaterial(materialType, params, true, true);
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

    getSessionMaterial(id) {
        return this._sessionMaterials[id];
    }

    getType(materialId) {
        return this._materials[materialId].getMaterialType();
    }

    reset() {
        this._materials = {};
        this._sessionMaterials = {};
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
