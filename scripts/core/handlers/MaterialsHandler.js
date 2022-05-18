/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BasicMaterial from '/scripts/core/assets/materials/BasicMaterial.js';
import LambertMaterial from '/scripts/core/assets/materials/LambertMaterial.js';
import NormalMaterial from '/scripts/core/assets/materials/NormalMaterial.js';
import PhongMaterial from '/scripts/core/assets/materials/PhongMaterial.js';
import StandardMaterial from '/scripts/core/assets/materials/StandardMaterial.js';
import ToonMaterial from '/scripts/core/assets/materials/ToonMaterial.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const MATERIAL_TYPE_TO_ADD_FUNCTION = {};
MATERIAL_TYPE_TO_ADD_FUNCTION[MaterialTypes.BASIC] = "addBasicMaterial";
MATERIAL_TYPE_TO_ADD_FUNCTION[MaterialTypes.LAMBERT] = "addLambertMaterial";
MATERIAL_TYPE_TO_ADD_FUNCTION[MaterialTypes.NORMAL] = "addNormalMaterial";
MATERIAL_TYPE_TO_ADD_FUNCTION[MaterialTypes.PHONG] = "addPhongMaterial";
MATERIAL_TYPE_TO_ADD_FUNCTION[MaterialTypes.STANDARD] = "addStandardMaterial";
MATERIAL_TYPE_TO_ADD_FUNCTION[MaterialTypes.TOON] = "addToonMaterial";

class MaterialsHandler {
    constructor() {
        this._materials = {};
    }

    addBasicMaterial(params, ignoreUndoRedo) {
        let material = new BasicMaterial(params);
        this._addMaterial(material, ignoreUndoRedo);
        return material;
    }

    addLambertMaterial(params, ignoreUndoRedo) {
        let material = new LambertMaterial(params);
        this._addMaterial(material, ignoreUndoRedo);
        return material;
    }

    addNormalMaterial(params, ignoreUndoRedo) {
        let material = new NormalMaterial(params);
        this._addMaterial(material, ignoreUndoRedo);
        return material;
    }

    addPhongMaterial(params, ignoreUndoRedo) {
        let material = new PhongMaterial(params);
        this._addMaterial(material, ignoreUndoRedo);
        return material;
    }

    addStandardMaterial(params, ignoreUndoRedo) {
        let material = new StandardMaterial(params);
        this._addMaterial(material, ignoreUndoRedo);
        return material;
    }

    addToonMaterial(params, ignoreUndoRedo) {
        let material = new ToonMaterial(params);
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
        } else {
            material.undoDispose();
        }
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
            if(!(materialType in MATERIAL_TYPE_TO_ADD_FUNCTION)) {
                console.error("Unrecognized material found");
                continue;
            }
            for(let params of materials[materialType]) {
                this[MATERIAL_TYPE_TO_ADD_FUNCTION[materialType]](params, true);
            }
        }
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
