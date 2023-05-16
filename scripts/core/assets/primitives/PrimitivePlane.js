/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/primitives/PrimitiveMesh.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ShapesHandler from '/scripts/core/handlers/ShapesHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class PrimitivePlane extends PrimitiveMesh {
    constructor(params = {}) {
        params['assetId'] = PrimitivePlane.assetId;
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
    }

    _getDefaultName() {
        return PrimitivePlane.assetName;
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

    getHeight() {
        return this._height;
    }

    getWidth() {
        return this._width;
    }

    getHeightSegments() {
        return this._heightSegments;
    }

    getWidthSegments() {
        return this._widthSegments;
    }

    setHeight(height) {
        if(this._height == height) return;
        this._height = height;
        this._updateGeometry();
    }

    setWidth(width) {
        if(this._width == width) return;
        this._width = width;
        this._updateGeometry();
    }

    setHeightSegments(heightSegments) {
        if(this._heightSegments == heightSegments) return;
        this._heightSegments = heightSegments;
        this._updateGeometry();
    }

    setWidthSegments(widthSegments) {
        if(this._widthSegments == widthSegments) return;
        this._widthSegments = widthSegments;
        this._updateGeometry();
    }

    static assetId = '936bd538-9cb8-44f5-b21f-6b4a7eccfff4';
    static assetName = 'Plane';
}

ShapesHandler.registerAsset(PrimitivePlane);
LibraryHandler.loadBuiltIn(PrimitivePlane);
