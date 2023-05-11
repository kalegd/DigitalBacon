/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class Asset {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._assetId = params['assetId'];
        this._name = ('name' in params)
            ? params['name']
            : this._getDefaultName();
        this._components = new Set();
        if(params['components']) {
            params['components'].forEach((id) => { this.addComponent(id); });
        }
    }

    _getDefaultName() {
        console.error("Asset._getDefaultName() should be overridden");
        return;
    }

    exportParams() {
        let componentIds = [];
        for(let component of this._components) {
            componentIds.push(component.getId());
        }
        return {
            "id": this._id,
            "name": this._name,
            "assetId": this._assetId,
            "components": componentIds,
        };
    }

    updateFromParams(params) {
        for(let key in params) {
            let setter = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
            if(this[setter]) this[setter](params[key]);
        }
    }

    getAssetId() {
        return this._assetId;
    }

    getComponents(getActualComponents) {
        if(getActualComponents) return this._components;
        let componentIds = [];
        for(let component of this._components) {
            componentIds.push(component.getId());
        }
        return componentIds;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    setComponents(componentIds) {
        for(let component of this._components) {
            let componentId = component.getId();
            if(!componentIds.includes(componentId))
                this.removeComponent(componentId);
        }
        for(let componentId of componentIds) {
            let component = ComponentsHandler.getAsset(componentId);
            if(!this._components.has(component))
                this.addComponent(componentId);
        }
    }

    setName(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }

    addComponent(componentId, ignorePublish) {
        let component = ComponentsHandler.getAsset(componentId);
        if(!component) return;

        this._components.add(component);
        if(ignorePublish) return component;
        let componentAssetId = component.getAssetId();
        let topic = PubSubTopics.COMPONENT_ATTACHED + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
            assetId: this._assetId,
            assetType: this.constructor.assetType,
            componentId: componentId,
            componentAssetId: componentAssetId,
        });
        return component;
    }

    removeComponent(componentId, ignorePublish) {
        let component = ComponentsHandler.getAsset(componentId);
        if(!component) return;

        this._components.delete(component);
        if(ignorePublish) return component;
        let componentAssetId = component.constructor.assetId;
        let topic = PubSubTopics.COMPONENT_DETACHED + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
            assetId: this._assetId,
            assetType: this.constructor.assetType,
            componentId: componentId,
            componentAssetId: componentAssetId,
        });
        return component;
    }
}
