/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/primitives/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const ASSET_ID = '423c9506-52f4-4725-b848-69913cce2b00';
const ASSET_NAME = 'Sphere';

export default class PrimitiveSphere extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
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
    }

    _getDefaultName() {
        return ASSET_NAME;
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

    getRadius() {
        return this._radius;
    }

    getWidthSegments() {
        return this._widthSegments;
    }

    getHeightSegments() {
        return this._heightSegments;
    }

    getPhiLength() {
        return this._phiLength;
    }

    getThetaLength() {
        return this._thetaLength;
    }

    setRadius(radius) {
        if(this._radius == radius) return;
        this._radius = radius;
        this._updateGeometry();
    }

    setWidthSegments(widthSegments) {
        if(this._widthSegments == widthSegments) return;
        this._widthSegments = widthSegments;
        this._updateGeometry();
    }

    setHeightSegments(heightSegments) {
        if(this._heightSegments == heightSegments) return;
        this._heightSegments = heightSegments;
        this._updateGeometry();
    }

    setPhiLength(phiLength) {
        if(this._phiLength == phiLength) return;
        this._phiLength = phiLength;
        this._updateGeometry();
    }

    setThetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }
}

ProjectHandler.registerShape(PrimitiveSphere, ASSET_ID, ASSET_NAME);
