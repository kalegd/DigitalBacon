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
        this.setMap(params['map']);
    }

    _getDefaultName() {
        return SpotLight.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['angle'] = this.getDistance();
        //params['castShadow'] = this.getCastShadow();
        params['decay'] = this.getDecay();
        params['distance'] = this.getDistance();
        params['penumbra'] = this.getPenumbra();
        params['map'] = this.getMap();
        return params;
    }

    getAngle() {
        return this._angle;
    }

    //getCastShadow() {
    //    return this._light.castShadow;
    //}

    getDecay() {
        return this._light.decay;
    }

    getDistance() {
        return this._light.distance;
    }

    getMap() {
        return this._map;
    }

    getPenumbra() {
        return this._light.penumbra;
    }

    setAngle(angle) {
        this._angle = angle;
        angle *= Math.PI / 360;
        this._light.angle = angle;
    }

    //setCastShadow(castShadow) {
    //    this._light.castShadow = castShadow;
    //}

    setDecay(decay) {
        this._light.decay = decay;
    }

    setDistance(distance) {
        this._light.distance = distance;
    }

    setMap(map) {
        let oldMap = this._map;
        this._map = map;
        let texture = ProjectHandler.getAsset(map);
        this._light.map = (texture)
            ? texture.getTexture()
            : null;
        if(oldMap == map) return;
        if(oldMap) {
            let topic = PubSubTopics.TEXTURE_RECREATED + ':' + oldMap;
            PubSub.unsubscribe(this._id, topic);
        }
        if(map) {
            let topic = PubSubTopics.TEXTURE_RECREATED + ':' + map;
            PubSub.subscribe(this._id, topic, () => this.setMap(map));
        }
    }

    setPenumbra(penumbra) {
        this._light.penumbra = penumbra;
    }

    static assetId = '50d0ddbf-571f-4328-922c-a52cf8d27704';
    static assetName = 'Spot Light';
}

ProjectHandler.registerAsset(SpotLight);
LibraryHandler.loadBuiltIn(SpotLight);
