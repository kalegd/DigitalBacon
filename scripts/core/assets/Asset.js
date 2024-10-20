/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { uuidv4, uuidToBytes } from '/scripts/core/helpers/utils.module.js';

export default class Asset {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._idBytes = uuidToBytes(this._id);
        this._assetId = params['assetId'];
        this._name = ('name' in params)
            ? params['name']
            : this._getDefaultName();
        this._components = new Set();
        this._isPrivate = params['isPrivate']
            || this.constructor.isPrivate == true;
        if(params['components']) {
            params['components'].forEach((id) => this.addComponent(id));
        }
    }

    _getDefaultName() {
        console.error("Asset._getDefaultName() should be overridden");
        return;
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
            "assetId": this._assetId,
            "components": this.components,
            "isPrivate": this._isPrivate,
        };
    }

    updateFromParams(params) {
        for(let key in params) {
            if(this[key] != params[key]) this[key] = params[key];
        }
    }

    get assetId() { return this._assetId; }
    get components() {
        let componentIds = [];
        for(let component of this._components) {
            componentIds.push(component.id);
        }
        return componentIds;
    }
    get id() { return this._id; }
    get name() { return this._name; }
    get isPrivate() { return this._isPrivate || this.constructor.isPrivate; }

    set components(componentIds) {
        for(let component of this._components) {
            let componentId = component.id;
            if(!componentIds.includes(componentId))
                this.removeComponent(componentId, true);
        }
        for(let componentId of componentIds) {
            let component = ProjectHandler.getAsset(componentId);
            if(!this._components.has(component))
                this.addComponent(componentId, true);
        }
    }

    set name(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }

    set isPrivate(isPrivate) {
        this._isPrivate = isPrivate;
    }

    addComponent(componentId, ignorePublish) {
        let component = ProjectHandler.getAsset(componentId);
        if(!component) return;

        this._components.add(component);
        if(ignorePublish) return component;
        let componentAssetId = component.assetId;
        let topic = PubSubTopics.COMPONENT_ATTACHED + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
            componentId: componentId,
            componentAssetId: componentAssetId,
        });
        return component;
    }

    removeComponent(componentId, ignorePublish) {
        let component = ProjectHandler.getAsset(componentId);
        if(!component) return;

        this._components.delete(component);
        if(ignorePublish) return component;
        let componentAssetId = component.constructor.assetId;
        let topic = PubSubTopics.COMPONENT_DETACHED + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
            componentId: componentId,
            componentAssetId: componentAssetId,
        });
        return component;
    }
}
