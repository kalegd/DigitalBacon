/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = 'a6ffffc9-2cd0-4fb7-a7b1-7f334930af51';
const ASSET_NAME = 'Box';
const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "width", "name": "Width", "min": 0, "type": NumberInput },
    { "parameter": "height", "name": "Height", "min": 0, "type": NumberInput },
    { "parameter": "depth", "name": "Depth", "min": 0, "type": NumberInput },
    { "parameter": "widthSegments", "name": "Width Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "depthSegments", "name": "Depth Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveBox extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._width = numberOr(params['width'], 0.1);
        this._height = numberOr(params['height'], 0.1);
        this._depth = numberOr(params['depth'], 0.1);
        this._widthSegments = params['widthSegments'] || 1;
        this._heightSegments = params['heightSegments'] || 1;
        this._depthSegments = params['depthSegments'] || 1;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let geometry = new THREE.BoxGeometry(this._width, this._height,
            this._depth, this._widthSegments, this._heightSegments,
            this._depthSegments);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.BoxGeometry(this._width, this._height,
            this._depth, this._widthSegments, this._heightSegments,
            this._depthSegments);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    place(intersection) {
        //TODO: Depenetrate from the face using normal and bounding box
        super.place(intersection);
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

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) {
                continue;
            } else if(field.type == NumberInput) {
                menuFieldsMap[field.parameter] =
                    this._createGeometryNumberInput(field);
            }
        }
        return menuFieldsMap;
    }

}

ProjectHandler.registerShape(PrimitiveBox, ASSET_ID, ASSET_NAME);
