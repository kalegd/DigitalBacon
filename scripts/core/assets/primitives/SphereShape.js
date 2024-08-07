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

export default class SphereShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = SphereShape.assetId;
        super(params);
        this._radius = numberOr(params['radius'], 0.1);
        this._widthSegments = params['widthSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 16;
        this._phiLength = numberOr(params['phiLength'], 360);
        this._thetaLength = numberOr(params['thetaLength'], 180);
        this._createMesh();
    }

    _createMesh() {
        let phiLength = this._phiLength * Math.PI / 180;
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.SphereGeometry(this._radius,
            this._widthSegments, this._heightSegments, 0, phiLength, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
        this._updateBVH();
        this._configureMesh();
    }

    _getDefaultName() {
        return SphereShape.assetName;
    }

    _updateGeometry() {
        let phiLength = this._phiLength * Math.PI / 180;
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.SphereGeometry(this._radius,
            this._widthSegments, this._heightSegments, 0, phiLength, 0,
            thetaLength);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['radius'] = this._radius;
        params['widthSegments'] = this._widthSegments;
        params['heightSegments'] = this._heightSegments;
        params['phiLength'] = this._phiLength;
        params['thetaLength'] = this._thetaLength;
        return params;
    }

    get radius() { return this._radius; }
    get widthSegments() { return this._widthSegments; }
    get heightSegments() { return this._heightSegments; }
    get phiLength() { return this._phiLength; }
    get thetaLength() { return this._thetaLength; }

    set radius(radius) {
        if(this._radius == radius) return;
        this._radius = radius;
        this._updateGeometry();
    }

    set widthSegments(widthSegments) {
        if(this._widthSegments == widthSegments) return;
        this._widthSegments = widthSegments;
        this._updateGeometry();
    }

    set heightSegments(heightSegments) {
        if(this._heightSegments == heightSegments) return;
        this._heightSegments = heightSegments;
        this._updateGeometry();
    }

    set phiLength(phiLength) {
        if(this._phiLength == phiLength) return;
        this._phiLength = phiLength;
        this._updateGeometry();
    }

    set thetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }

    static assetId = '423c9506-52f4-4725-b848-69913cce2b00';
    static assetName = 'Sphere';
}

ProjectHandler.registerAsset(SphereShape);
LibraryHandler.loadBuiltIn(SphereShape);
