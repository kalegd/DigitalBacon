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

export default class CylinderShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = CylinderShape.assetId;
        super(params);
        this._height = numberOr(params['height'], 0.2);
        this._radiusTop = numberOr(params['radiusTop'], 0.1);
        this._radiusBottom = numberOr(params['radiusBottom'], 0.1);
        this._radialSegments = params['radialSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._openEnded = params['openEnded'] || false;
        this._createMesh();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.CylinderGeometry(this._radiusTop,
            this._radiusBottom, this._height, this._radialSegments,
            this._heightSegments, this._openEnded, 0, thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
        this._updateBVH();
        this._configureMesh();
    }

    _getDefaultName() {
        return CylinderShape.assetName;
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.CylinderGeometry(this._radiusTop,
            this._radiusBottom, this._height, this._radialSegments,
            this._heightSegments, this._openEnded, 0, thetaLength);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['height'] = this._height;
        params['radiusTop'] = this._radiusTop;
        params['radiusBottom'] = this._radiusBottom;
        params['radialSegments'] = this._radialSegments;
        params['heightSegments'] = this._heightSegments;
        params['thetaLength'] = this._thetaLength;
        params['openEnded'] = this._openEnded;
        return params;
    }

    get height() { return this._height; }
    get radiusTop() { return this._radiusTop; }
    get radiusBottom() { return this._radiusBottom; }
    get radialSegments() { return this._radialSegments; }
    get heightSegments() { return this._heightSegments; }
    get thetaLength() { return this._thetaLength; }
    get openEnded() { return this._openEnded; }

    set height(height) {
        if(this._height == height) return;
        this._height = height;
        this._updateGeometry();
    }

    set radiusTop(radiusTop) {
        if(this._radiusTop == radiusTop) return;
        this._radiusTop = radiusTop;
        this._updateGeometry();
    }

    set radiusBottom(radiusBottom) {
        if(this._radiusBottom == radiusBottom) return;
        this._radiusBottom = radiusBottom;
        this._updateGeometry();
    }

    set radialSegments(radialSegments) {
        if(this._radialSegments == radialSegments) return;
        this._radialSegments = radialSegments;
        this._updateGeometry();
    }

    set heightSegments(heightSegments) {
        if(this._heightSegments == heightSegments) return;
        this._heightSegments = heightSegments;
        this._updateGeometry();
    }

    set thetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }

    set openEnded(openEnded) {
        if(this._openEnded == openEnded) return;
        this._openEnded = openEnded;
        this._updateGeometry();
    }


    static assetId = 'f4efc996-0d50-48fe-9313-3c7b1a5c1754';
    static assetName = 'Cylinder';
}

ProjectHandler.registerAsset(CylinderShape);
LibraryHandler.loadBuiltIn(CylinderShape);
