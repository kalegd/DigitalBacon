/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Shape from '/scripts/core/assets/primitives/Shape.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class CircleShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = CircleShape.assetId;
        super(params);
        this._radius = numberOr(params['radius'], 0.1);
        this._segments = params['segments'] || 32;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._createMesh();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.CircleGeometry(this._radius, this._segments, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
        this._updateBVH();
        this._configureMesh();
    }

    _getDefaultName() {
        return CircleShape.assetName;
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.CircleGeometry(this._radius, this._segments, 0,
            thetaLength);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['radius'] = this._radius;
        params['segments'] = this._segments;
        params['thetaLength'] = this._thetaLength;
        return params;
    }

    get radius() { return this._radius; }
    get segments() { return this._segments; }
    get thetaLength() { return this._thetaLength; }

    set radius(radius) {
        if(this._radius == radius) return;
        this._radius = radius;
        this._updateGeometry();
    }

    set segments(segments) {
        if(this._segments == segments) return;
        this._segments = segments;
        this._updateGeometry();
    }

    set thetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }

    static assetId = '0a0c7c21-d834-4a88-9234-0d9b5cf705f6';
    static assetName = 'Circle';
}

ProjectHandler.registerAsset(CircleShape);
LibraryHandler.loadBuiltIn(CircleShape);
