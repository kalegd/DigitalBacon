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

class SystemsHandler {
    constructor() {
        this._systems = {};
        this._systemClassMap = {};
        this._sessionSystems = {};
    }

    addNewSystem(typeId, params, ignoreUndoRedo, ignorePublish) {
        let system = new this._systemClassMap[typeId](params);
        this.addSystem(system, ignoreUndoRedo, ignorePublish);
        return system;
    }

    addSystem(system, ignoreUndoRedo, ignorePublish) {
        if(this._systems[system.getId()]) return;
        this._systems[system.getId()] = system;
        this._sessionSystems[system.getId()] = system;
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(system);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteSystem(system, true, ignorePublish);
            }, () => {
                this.addSystem(system, true, ignorePublish);
            });
        }
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.SYSTEM_ADDED, system);
    }

    deleteSystem(system, ignoreUndoRedo, ignorePublish) {
        if(!(system.getId() in this._systems)) return;
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this.addSystem(system, true, ignorePublish);
            }, () => {
                this.deleteSystem(system, true, ignorePublish);
            });
        }
        delete this._systems[system.getId()];
        if(ignorePublish) return;
        PubSub.publish(this._id, PubSubTopics.SYSTEM_DELETED, {
            system: system,
            undoRedoAction: undoRedoAction,
        });
    }

    load(systems) {
        if(!systems) return;
        for(let systemTypeId in systems) {
            if(!(systemTypeId in this._systemClassMap)) {
                console.error("Unrecognized system found");
                continue;
            }
            for(let params of systems[systemTypeId]) {
                this.addNewSystem(systemTypeId, params, true, true);
            }
        }
    }

    registerSystem(systemClass, systemTypeId) {
        this._systemClassMap[systemTypeId] = systemClass;
    }

    getSystems() {
        return this._systems;
    }

    getSystem(systemId) {
        return this._systems[systemId];
    }

    getSessionSystem(id) {
        return this._sessionSystems[id];
    }

    getTypeName(typeId) {
        if(typeId in this._systemClassMap)
            return this._systemClassMap[typeId].getName();
        return null;
    }

    getTypeId(systemId) {
        return this._systems[systemId].getSystemTypeId();
    }

    getTypeIds() {
        return Object.keys(this._systemClassMap);
    }

    reset() {
        this._systems = {};
        this._sessionSystems = {};
    }

    getSystemsAssetIds() {
        let assetIds = new Set();
        //TODO: Fetch assetIds of each system
        return assetIds;
    }

    getSystemsDetails() {
        let systemsDetails = {};
        for(let systemId in this._systems) {
            let system = this._systems[systemId];
            let typeId = system.getSystemTypeId();
            let params = system.exportParams();
            if(!(typeId in systemsDetails)) systemsDetails[typeId] = [];
            systemsDetails[typeId].push(params);
        }
        return systemsDetails;
    }
}

let systemsHandler = new SystemsHandler();
export default systemsHandler;
