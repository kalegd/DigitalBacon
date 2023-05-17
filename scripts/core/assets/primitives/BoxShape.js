/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Shape from '/scripts/core/assets/primitives/Shape.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ShapesHandler from '/scripts/core/handlers/ShapesHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class BoxShape extends Shape {
    constructor(params = {}) {
        params['assetId'] = BoxShape.assetId;
        super(params);
        this._width = numberOr(params['width'], 0.1);
        this._height = numberOr(params['height'], 0.1);
        this._depth = numberOr(params['depth'], 0.1);
        this._widthSegments = params['widthSegments'] || 1;
        this._heightSegments = params['heightSegments'] || 1;
        this._depthSegments = params['depthSegments'] || 1;
        this._createMesh();
    }

    _createMesh() {
        let geometry = new THREE.BoxGeometry(this._width, this._height,
            this._depth, this._widthSegments, this._heightSegments,
            this._depthSegments);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _getDefaultName() {
        return BoxShape.assetName;
    }

    _updateGeometry() {
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.BoxGeometry(this._width, this._height,
            this._depth, this._widthSegments, this._heightSegments,
            this._depthSegments);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    exportParams() {
        let params = super.exportParams();
        params['width'] = this._width;
        params['height'] = this._height;
        params['depth'] = this._depth;
        params['widthSegments'] = this._widthSegments;
        params['heightSegments'] = this._heightSegments;
        params['depthSegments'] = this._depthSegments;
        return params;
    }

    getDepth() {
        return this._depth;
    }

    getHeight() {
        return this._height;
    }

    getWidth() {
        return this._width;
    }

    getDepthSegments() {
        return this._depthSegments;
    }

    getHeightSegments() {
        return this._heightSegments;
    }

    getWidthSegments() {
        return this._widthSegments;
    }

    setDepth(depth) {
        if(this._depth == depth) return;
        this._depth = depth;
        this._updateGeometry();
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

    setDepthSegments(depthSegments) {
        if(this._depthSegments == depthSegments) return;
        this._depthSegments = depthSegments;
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

    static assetId = 'a6ffffc9-2cd0-4fb7-a7b1-7f334930af51';
    static assetName = 'Box';
}

ShapesHandler.registerAsset(BoxShape);
LibraryHandler.loadBuiltIn(BoxShape);
