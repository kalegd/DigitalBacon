/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import PrimitiveCylinderHelper from '/scripts/core/helpers/editor/PrimitiveCylinderHelper.js';
import * as THREE from 'three';

const ASSET_ID = 'f4efc996-0d50-48fe-9313-3c7b1a5c1754';
const ASSET_NAME = 'Cylinder';

export default class PrimitiveCylinder extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._height = numberOr(params['height'], 0.2);
        this._radiusTop = numberOr(params['radiusTop'], 0.1);
        this._radiusBottom = numberOr(params['radiusBottom'], 0.1);
        this._radialSegments = params['radialSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._openEnded = params['openEnded'] || false;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createEditorHelper() {
        this._editorHelper = new PrimitiveCylinderHelper(this);
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.CylinderGeometry(this._radiusTop,
            this._radiusBottom, this._height, this._radialSegments,
            this._heightSegments, this._openEnded, 0, thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
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

    place(intersection) {
        //TODO: Depenetrate from the face using normal and bounding box
        super.place(intersection);
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

    getHeight() {
        return this._height;
    }

    getRadiusTop() {
        return this._radiusTop;
    }

    getRadiusBottom() {
        return this._radiusBottom;
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

    setRadiusTop(radiusTop) {
        if(this._radiusTop == radiusTop) return;
        this._radiusTop = radiusTop;
        this._updateGeometry();
    }

    setRadiusBottom(radiusBottom) {
        if(this._radiusBottom == radiusBottom) return;
        this._radiusBottom = radiusBottom;
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

}

ProjectHandler.registerShape(PrimitiveCylinder, ASSET_ID, ASSET_NAME);
