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

export default class PlaneShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = PlaneShape.assetId;
        super(params);
        this._width = numberOr(params['width'], 0.1);
        this._height = numberOr(params['height'], 0.1);
        this._widthSegments = params['widthSegments'] || 1;
        this._heightSegments = params['heightSegments'] || 1;
        this._createMesh();
    }

    _createMesh() {
        let geometry = new THREE.PlaneGeometry(this._width, this._height,
            this._widthSegments, this._heightSegments);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
        this._updateBVH();
        this._configureMesh();
    }

    _getDefaultName() {
        return PlaneShape.assetName;
    }

    _updateGeometry() {
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.PlaneGeometry(this._width, this._height,
            this._widthSegments, this._heightSegments);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['width'] = this._width;
        params['height'] = this._height;
        params['widthSegments'] = this._widthSegments;
        params['heightSegments'] = this._heightSegments;
        return params;
    }

    get height() { return this._height; }
    get width() { return this._width; }
    get heightSegments() { return this._heightSegments; }
    get widthSegments() { return this._widthSegments; }

    set height(height) {
        if(this._height == height) return;
        this._height = height;
        this._updateGeometry();
    }

    set width(width) {
        if(this._width == width) return;
        this._width = width;
        this._updateGeometry();
    }

    set heightSegments(heightSegments) {
        if(this._heightSegments == heightSegments) return;
        this._heightSegments = heightSegments;
        this._updateGeometry();
    }

    set widthSegments(widthSegments) {
        if(this._widthSegments == widthSegments) return;
        this._widthSegments = widthSegments;
        this._updateGeometry();
    }

    static assetId = '936bd538-9cb8-44f5-b21f-6b4a7eccfff4';
    static assetName = 'Plane';
}

ProjectHandler.registerAsset(PlaneShape);
LibraryHandler.loadBuiltIn(PlaneShape);
