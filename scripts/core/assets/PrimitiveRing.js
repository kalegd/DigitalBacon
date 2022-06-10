/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import PrimitiveRingHelper from '/scripts/core/helpers/editor/PrimitiveRingHelper.js';
import * as THREE from 'three';

const ASSET_ID = '534f29c3-1e85-4510-bb84-459011de6722';
const ASSET_NAME = 'Ring';

export default class PrimitiveRing extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._innerRadius = numberOr(params['innerRadius'], 0.05);
        this._outerRadius = numberOr(params['outerRadius'], 0.1);
        this._thetaSegments = params['thetaSegments'] || 32;
        this._phiSegments = params['phiSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createEditorHelper() {
        this._editorHelper = new PrimitiveRingHelper(this);
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.RingGeometry(this._innerRadius,
            this._outerRadius, this._thetaSegments, this._phiSegments, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
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

    getInnerRadius() {
        return this._innerRadius;
    }

    getOuterRadius() {
        return this._outeRadius;
    }

    getThetaSegments() {
        return this._thetaSegments;
    }

    getPhiSegments() {
        return this._phiSegments;
    }

    getThetaLength() {
        return this._thetaLength;
    }

    setInnerRadius(innerRadius) {
        if(this._innerRadius == innerRadius) return;
        this._innerRadius = innerRadius;
        this._updateGeometry();
    }

    setOuterRadius(outeRadius) {
        if(this._outeRadius == outeRadius) return;
        this._outeRadius = outeRadius;
        this._updateGeometry();
    }

    setThetaSegments(thetaSegments) {
        if(this._thetaSegments == thetaSegments) return;
        this._thetaSegments = thetaSegments;
        this._updateGeometry();
    }

    setPhiSegments(phiSegments) {
        if(this._phiSegments == phiSegments) return;
        this._phiSegments = phiSegments;
        this._updateGeometry();
    }

    setThetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }
}

ProjectHandler.registerShape(PrimitiveRing, ASSET_ID, ASSET_NAME);
