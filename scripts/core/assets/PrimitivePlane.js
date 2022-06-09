/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = '936bd538-9cb8-44f5-b21f-6b4a7eccfff4';
const ASSET_NAME = 'Plane';
const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "width", "name": "Width", "min": 0, "type": NumberInput },
    { "parameter": "height", "name": "Height", "min": 0, "type": NumberInput },
    { "parameter": "widthSegments", "name": "Width Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitivePlane extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._width = numberOr(params['width'], 0.1);
        this._height = numberOr(params['height'], 0.1);
        this._widthSegments = params['widthSegments'] || 1;
        this._heightSegments = params['heightSegments'] || 1;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let geometry = new THREE.PlaneGeometry(this._width, this._height,
            this._widthSegments, this._heightSegments);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.PlaneGeometry(this._width, this._height,
            this._widthSegments, this._heightSegments);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    place(intersection) {
        let object = intersection.object;
        let point = intersection.point;
        let face = intersection.face;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld);
        this._object.position.copy(normal)
            .clampLength(0, 0.001)
            .add(point);
        this._object.lookAt(normal.add(this._object.position));
        this.roundAttributes();
    }

    exportParams() {
        let params = super.exportParams();
        params['width'] = this._width;
        params['height'] = this._height;
        params['widthSegments'] = this._widthSegments;
        params['heightSegments'] = this._heightSegments;
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

ProjectHandler.registerShape(PrimitivePlane, ASSET_ID, ASSET_NAME);
