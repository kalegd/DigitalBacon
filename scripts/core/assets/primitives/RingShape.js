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

export default class RingShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = RingShape.assetId;
        super(params);
        this._innerRadius = numberOr(params['innerRadius'], 0.05);
        this._outerRadius = numberOr(params['outerRadius'], 0.1);
        this._thetaSegments = params['thetaSegments'] || 32;
        this._phiSegments = params['phiSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._createMesh();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.RingGeometry(this._innerRadius,
            this._outerRadius, this._thetaSegments, this._phiSegments, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
        this._updateBVH();
    }

    _getDefaultName() {
        return RingShape.assetName;
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.RingGeometry(this._innerRadius,
            this._outerRadius, this._thetaSegments, this._phiSegments, 0,
            thetaLength);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['innerRadius'] = this._innerRadius;
        params['outerRadius'] = this._outerRadius;
        params['thetaSegments'] = this._thetaSegments;
        params['phiSegments'] = this._phiSegments;
        params['thetaLength'] = this._thetaLength;
        return params;
    }

    get innerRadius() { return this._innerRadius; }
    get outerRadius() { return this._outerRadius; }
    get thetaSegments() { return this._thetaSegments; }
    get phiSegments() { return this._phiSegments; }
    get thetaLength() { return this._thetaLength; }

    set innerRadius(innerRadius) {
        if(this._innerRadius == innerRadius) return;
        this._innerRadius = innerRadius;
        this._updateGeometry();
    }

    set outerRadius(outerRadius) {
        if(this._outerRadius == outerRadius) return;
        this._outerRadius = outerRadius;
        this._updateGeometry();
    }

    set thetaSegments(thetaSegments) {
        if(this._thetaSegments == thetaSegments) return;
        this._thetaSegments = thetaSegments;
        this._updateGeometry();
    }

    set phiSegments(phiSegments) {
        if(this._phiSegments == phiSegments) return;
        this._phiSegments = phiSegments;
        this._updateGeometry();
    }

    set thetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }

    static assetId = '534f29c3-1e85-4510-bb84-459011de6722';
    static assetName = 'Ring';
}

ProjectHandler.registerAsset(RingShape);
LibraryHandler.loadBuiltIn(RingShape);
