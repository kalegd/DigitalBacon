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

class ComponentsHandler {
    constructor() {
        this._components = {};
        this._componentClassMap = {};
        this._sessionComponents = {};
    }

    addNewComponent(assetId, params, ignoreUndoRedo, ignorePublish) {
        let component = new this._componentClassMap[assetId](params);
        this.addComponent(component, ignoreUndoRedo, ignorePublish);
        return component;
    }

    addComponent(component, ignoreUndoRedo, ignorePublish) {
        if(this._components[component.getId()]) return;
        this._components[component.getId()] = component;
        this._sessionComponents[component.getId()] = component;
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(component);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteComponent(component, true, ignorePublish);
            }, () => {
                this.addComponent(component, true, ignorePublish);
            });
        }
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.COMPONENT_ADDED, component);
    }

    deleteComponent(component, ignoreUndoRedo, ignorePublish) {
        if(!(component.getId() in this._components)) return;
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this.addComponent(component, true, ignorePublish);
            }, () => {
                this.deleteComponent(component, true, ignorePublish);
            });
        }
        delete this._components[component.getId()];
        if(ignorePublish) return;
        PubSub.publish(this._id, PubSubTopics.COMPONENT_DELETED, {
            component: component,
            undoRedoAction: undoRedoAction,
        });
    }

    load(components, isDiff) {
        if(!components) return;
        if(isDiff) {
            let componentsToDelete = [];
            for(let id in this._components) {
                let component = this._components[id];
                let assetId = component.getAssetId();
                if(!(assetId in components) ||!components[assetId].includes(id))
                    componentsToDelete.push(component);
            }
            for(let component of componentsToDelete) {
                this.deleteComponent(component, true, true);
            }
        }
        for(let componentTypeId in components) {
            if(!(componentTypeId in this._componentClassMap)) {
                console.error("Unrecognized component found");
                continue;
            }
            for(let params of components[componentTypeId]) {
                if(isDiff && this._components[params.id]) {
                    this._components[params.id].updateFromParams(params);
                } else {
                    this.addNewComponent(componentTypeId, params, true, true);
                }
            }
        }
    }

    registerComponent(componentClass) {
        this._componentClassMap[componentClass.assetId] = componentClass;
    }

    getComponents() {
        return this._components;
    }

    getComponent(componentId) {
        return this._components[componentId];
    }

    getComponentClasses() {
        return Object.values(this._componentClassMap);
    }

    getSessionComponent(id) {
        return this._sessionComponents[id];
    }

    reset() {
        this._components = {};
        this._sessionComponents = {};
    }

    getComponentsAssetIds() {
        let assetIds = new Set();
        //TODO: Fetch assetIds of each component
        return assetIds;
    }

    getComponentsDetails() {
        let componentsDetails = {};
        for(let componentId in this._components) {
            let component = this._components[componentId];
            let assetId = component.getAssetId();
            let params = component.exportParams();
            if(!(assetId in componentsDetails)) componentsDetails[assetId] = [];
            componentsDetails[assetId].push(params);
        }
        return componentsDetails;
    }
}

let componentsHandler = new ComponentsHandler();
export default componentsHandler;
