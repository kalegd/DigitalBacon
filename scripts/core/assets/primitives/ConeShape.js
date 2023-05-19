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

export default class ConeShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = ConeShape.assetId;
        super(params);
        this._height = numberOr(params['height'], 0.2);
        this._radius = numberOr(params['radius'], 0.1);
        this._radialSegments = params['radialSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._openEnded = params['openEnded'] || false;
        this._createMesh();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.ConeGeometry(this._radius, this._height,
            this._radialSegments, this._heightSegments, this._openEnded, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _getDefaultName() {
        return ConeShape.assetName;
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.ConeGeometry(this._radius, this._height,
            this._radialSegments, this._heightSegments, this._openEnded, 0,
            thetaLength);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['height'] = this._height;
        params['radius'] = this._radius;
        params['radialSegments'] = this._radialSegments;
        params['heightSegments'] = this._heightSegments;
        params['thetaLength'] = this._thetaLength;
        params['openEnded'] = this._openEnded;
        return params;
    }

    getHeight() {
        return this._height;
    }

    getRadius() {
        return this._radius;
    }

    getRadialSegments() {
        return this._radialSegments;
    }

    getHeightSegments() {
        return this._heightSegments;
    }

    getThetaLength() {
        return this._thetaLength;
    }

    getOpenEnded() {
        return this._openEnded;
    }

    setHeight(height) {
        if(this._height == height) return;
        this._height = height;
        this._updateGeometry();
    }

    setRadius(radius) {
        if(this._radius == radius) return;
        this._radius = radius;
        this._updateGeometry();
    }

    setRadialSegments(radialSegments) {
        if(this._radialSegments == radialSegments) return;
        this._radialSegments = radialSegments;
        this._updateGeometry();
    }

    setHeightSegments(heightSegments) {
        if(this._heightSegments == heightSegments) return;
        this._heightSegments = heightSegments;
        this._updateGeometry();
    }

    setThetaLength(thetaLength) {
        if(this._thetaLength == thetaLength) return;
        this._thetaLength = thetaLength;
        this._updateGeometry();
    }

    setOpenEnded(openEnded) {
        if(this._openEnded == openEnded) return;
        this._openEnded = openEnded;
        this._updateGeometry();
    }

    static assetId = '42779f01-e2cc-495a-a4b3-b286197fa762';
    static assetName = 'Cone';
}

ProjectHandler.registerAsset(ConeShape);
LibraryHandler.loadBuiltIn(ConeShape);
