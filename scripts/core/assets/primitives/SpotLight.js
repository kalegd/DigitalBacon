/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Light from '/scripts/core/assets/primitives/Light.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class SpotLight extends Light {
    constructor(params = {}) {
        params['intensity'] = numberOr(params['intensity'], 10);
        params['assetId'] = SpotLight.assetId;
        super(params);
        this._createLight(params);
    }

    _createLight(params) {
        this._angle = numberOr(params['angle'], 60);
        let angle = this._angle * Math.PI / 360;
        //let castShadow = params['castShadow'] || false;
        let decay = numberOr(params['decay'], 2);
        let distance = numberOr(params['distance'], 0);
        let penumbra = numberOr(params['penumbra'], 0.5);
        this._light = new THREE.SpotLight(this._color, this._intensity,
            distance, angle, penumbra, decay);
        //this._light.castShadow = castShadow;
        this._light.position.fromArray([0, 0, 0]);
        this._light.target.position.fromArray([0, -1, 0]);
        this._light.add(this._light.target);
        this._object.add(this._light);
        this.mapId = params['mapId'];
    }

    _getDefaultName() {
        return SpotLight.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['angle'] = this._angle;
        //params['castShadow'] = this.castShadow;
        params['decay'] = this.decay;
        params['distance'] = this.distance;
        params['penumbra'] = this.penumbra;
        params['mapId'] = this._mapId;
        return params;
    }

    get angle() { return this._angle; }
    //get castShadow() { return this._light.castShadow; }
    get decay() { return this._light.decay; }
    get distance() { return this._light.distance; }
    get mapId() { return this._mapId; }
    get penumbra() { return this._light.penumbra; }

    set angle(angle) {
        this._angle = angle;
        angle *= Math.PI / 360;
        this._light.angle = angle;
    }

    //set castShadow(castShadow) { this._light.castShadow = castShadow; }

    set decay(decay) { this._light.decay = decay; }

    set distance(distance) { this._light.distance = distance; }

    set mapId(mapId) {
        let oldMapId = this._mapId;
        this._mapId = mapId;
        let textureAsset = ProjectHandler.getAsset(mapId);
        this._light.map = (textureAsset)
            ? textureAsset.texture
            : null;
        if(oldMapId == mapId) return;
        if(oldMapId) {
            let topic = PubSubTopics.TEXTURE_RECREATED + ':' + oldMapId;
            PubSub.unsubscribe(this._id, topic);
        }
        if(mapId) {
            let topic = PubSubTopics.TEXTURE_RECREATED + ':' + mapId;
            PubSub.subscribe(this._id, topic, () => this.mapId = mapId);
        }
    }

    set penumbra(penumbra) { this._light.penumbra = penumbra; }

    static assetId = '50d0ddbf-571f-4328-922c-a52cf8d27704';
    static assetName = 'Spot Light';
}

ProjectHandler.registerAsset(SpotLight);
LibraryHandler.loadBuiltIn(SpotLight);
