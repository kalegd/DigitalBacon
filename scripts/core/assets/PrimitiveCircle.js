/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import PrimitiveCircleHelper from '/scripts/core/helpers/editor/PrimitiveCircleHelper.js';
import * as THREE from 'three';

const ASSET_ID = '0a0c7c21-d834-4a88-9234-0d9b5cf705f6';
const ASSET_NAME = 'Circle';

export default class PrimitiveCircle extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._radius = numberOr(params['radius'], 0.1);
        this._segments = params['segments'] || 32;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createEditorHelper() {
        this._editorHelper = new PrimitiveCircleHelper(this);
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.CircleGeometry(this._radius, this._segments, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
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

    getRadius() {
        return this._radius;
    }

    getSegments() {
        return this._segments;
    }

    getThetaLength() {
        return this._thetaLength;
    }

    setRadius(radius) {
        if(this._radius == radius) return;
        this._radius = radius;
        this._updateGeometry();
    }

    setSegments(segments) {
        if(this._segments == segments) return;
        this._segments = segments;
        this._updateGeometry();
    }

    setThetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }
}

ProjectHandler.registerShape(PrimitiveCircle, ASSET_ID, ASSET_NAME);
