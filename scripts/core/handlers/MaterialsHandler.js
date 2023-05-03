/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import * as THREE from 'three';

const SHOULD_HAVE_REFACTORED_SOONER = {
    BASIC: '943b7a57-7e8f-4717-9bc6-0ba2637d9e3b',
    LAMBERT: '5169a83b-1e75-4cb1-8c33-c049726d97e4',
    NORMAL: '61262e1f-5495-4280-badc-b9e4599026f7',
    PHONG: 'c9cfa45a-99b4-4166-b252-1c68b52773b0',
    STANDARD: 'a6a1aa81-50a6-4773-aaf5-446d418c9817',
    TOON: 'be461019-0fc2-4c88-bee4-290ee3a585eb',
};

class MaterialsHandler {
    constructor() {
        this._id = uuidv4();
        this._materials = {};
        this._materialClassMap = {};
        this._sessionMaterials = {};
    }

    addNewMaterial(assetId, params, ignoreUndoRedo, ignorePublish) {
        let material = new this._materialClassMap[assetId](params);
        this.addMaterial(material, ignoreUndoRedo, ignorePublish);
        return material;
    }

    addMaterial(material, ignoreUndoRedo, ignorePublish) {
        if(this._materials[material.getId()]) return;
        this._materials[material.getId()] = material;
        this._sessionMaterials[material.getId()] = material;
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(material);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteMaterial(material, true, ignorePublish);
            }, () => {
                this.addMaterial(material, true, ignorePublish);
            });
        }
        if(material.editorHelper) material.editorHelper.undoDispose();
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
        if(material.editorHelper) material.editorHelper.dispose();
        delete this._materials[material.getId()];
        if(ignorePublish) return;
        PubSub.publish(this._id, PubSubTopics.MATERIAL_DELETED, {
            material: material,
            undoRedoAction: undoRedoAction,
        });
    }

    load(materials) {
        if(!materials) return;
        this._handleOldVersion(materials);
        for(let assetId in materials) {
            if(!(assetId in this._materialClassMap)) {
                console.error("Unrecognized material found");
                continue;
            }
            for(let params of materials[assetId]) {
                this.addNewMaterial(assetId, params, true, true);
            }
        }
    }

    _handleOldVersion(materials) {
        let usingOldVersion = false;
        for(let type in SHOULD_HAVE_REFACTORED_SOONER) {
            if(type in materials) {
                let id = SHOULD_HAVE_REFACTORED_SOONER[type];
                materials[id] = materials[type];
                delete materials[type];
                usingOldVersion = true;
            }
        }
        if(usingOldVersion) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: "The project's version is outdated and won't be supported starting in July. Please save a new copy of it",
            });
        }
    }

    registerMaterial(materialClass) {
        this._materialClassMap[materialClass.assetId] = materialClass;
    }

    getMaterials() {
        return this._materials;
    }

    getMaterial(materialId) {
        return this._materials[materialId];
    }

    getMaterialClasses() {
        return Object.values(this._materialClassMap);
    }

    getSessionMaterial(id) {
        return this._sessionMaterials[id];
    }

    getAssetId(materialId) {
        return this._materials[materialId].getAssetId();
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
            let assetId = material.getAssetId();
            let params = material.exportParams();
            if(!(assetId in materialsDetails)) materialsDetails[assetId] = [];
            materialsDetails[assetId].push(params);
        }
        return materialsDetails;
    }
}

let materialsHandler = new MaterialsHandler();
export default materialsHandler;
