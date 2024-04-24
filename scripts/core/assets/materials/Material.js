/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { numberOr, disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class Material extends Asset {
    constructor(params = {}) {
        super(params);
        this._textureSubscriptions = {};
        this._opacity = numberOr(params['opacity'], 1);
        this._side = params['side'] || THREE.FrontSide;
        this._transparent = params['transparent'] || false;
    }

    _getDefaultName() {
        return 'Material';
    }

    _createMaterial() {
        console.error("Material._createMaterial() should be overridden");
        return;
    }

    _setTexture(param, newValue) {
        let oldValue = this['_' + param];
        this['_' + param] = newValue;
        let textureAsset = ProjectHandler.getAsset(newValue);
        this._material[param] = (textureAsset)
            ? textureAsset.texture
            : null;
        this._material.needsUpdate = true;
        if(oldValue == newValue) return;
        if(oldValue && oldValue in this._textureSubscriptions) {
            this._textureSubscriptions[oldValue].delete(param);
            if(this._textureSubscriptions[oldValue].size == 0) {
                let topic = PubSubTopics.TEXTURE_RECREATED + ':' + oldValue;
                PubSub.unsubscribe(this._id, topic);
                delete this._textureSubscriptions[oldValue];
            }
        }
        if(newValue) this._subscribeFor(param, newValue);
    }

    _subscribeFor(param, id) {
        if(!this._textureSubscriptions[id]) {
            let topic = PubSubTopics.TEXTURE_RECREATED + ':' + id;
            PubSub.subscribe(this._id, topic,
                () => this._updateRecreatedTextures(id));
            this._textureSubscriptions[id] = new Set();
        }
        this._textureSubscriptions[id].add(param);
    }

    _updateRecreatedTextures(id) {
        if(!this._textureSubscriptions[id]) return;
        for(let param of this._textureSubscriptions[id]) {
            this._setTexture(param, id);
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['opacity'] = this._material.opacity;
        params['side'] = this._material.side;
        params['transparent'] = this._material.transparent;
        return params;
    }

    _updateMaterialParamsWithMaps(params, maps) {
        for(let map of maps) {
            if(this['_' + map]) {
                let textureAsset = ProjectHandler.getAsset(this['_' + map]);
                if(textureAsset) {
                    params[map] = textureAsset.texture;
                    this._subscribeFor(map, this['_' + map]);
                }
            }
        }
    }

    dispose() {
        disposeMaterial(this._material);
    }

    getMaps() {
        return [];
    }

    getSampleTexture() {
        return null;
    }

    getMaterial() { return this._material; }

    get material() { return this._material; }
    get opacity() { return this._opacity; }
    get side() { return this._side; }
    get transparent() { return this._transparent; }

    set opacity(opacity) {
        if(this._opacity == opacity) return;
        this._opacity = opacity;
        this._material.opacity = opacity;
    }

    set side(side) {
        if(this._side == side) return;
        this._side = side;
        this._material.side = side;
        this._material.needsUpdate = true;
    }

    set transparent(transparent) {
        if(this._transparent == transparent) return;
        this._transparent = transparent;
        this._material.transparent = transparent;
        this._material.needsUpdate = true;
    }

    static assetType = AssetTypes.MATERIAL;
}
