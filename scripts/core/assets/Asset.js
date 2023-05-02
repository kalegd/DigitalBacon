/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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

    getAssetId() {
        return this._assetId;
    }

    getComponents() {
        return this._components;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    setName(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }

    addComponent(componentId) {
        let component = ComponentsHandler.getComponent(componentId);
        if(!component) {
            console.error('ERROR: Component not found');
            return;
        }
        this._components.add(component);
        return component;
    }

    removeComponent(componentId) {
        let component = ComponentsHandler.getSessionComponent(componentId);
        if(!component) {
            console.error('ERROR: Component not found');
            return;
        }
        this._components.delete(component);
        return component;
    }
}
