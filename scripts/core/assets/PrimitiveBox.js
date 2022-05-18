/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = 'a6ffffc9-2cd0-4fb7-a7b1-7f334930af51';
const ASSET_NAME = 'Box';
const FIELDS = [
    { "name": "Edit Visually" },
    { "name": "Material" },
    { "name": "Width", "parameter": "_width", "min": 0, "type": NumberInput },
    { "name": "Height", "parameter": "_height", "min": 0, "type": NumberInput },
    { "name": "Depth", "parameter": "_depth", "min": 0, "type": NumberInput },
    { "name": "Width Segments", "parameter": "_widthSegments", "min": 1,
        "type": NumberInput },
    { "name": "Height Segments", "parameter": "_heightSegments", "min": 1,
        "type": NumberInput },
    { "name": "Depth Segments", "parameter": "_depthSegments", "min": 1,
        "type": NumberInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitiveBox extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._width = params['width'] || 0.1;
        this._height = params['height'] || 0.1;
        this._depth = params['depth'] || 0.1;
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
            if(field.name in menuFieldsMap) {
                continue;
            } else if(field.type == NumberInput) {
                menuFieldsMap[field.name] = new NumberInput({
                    'title': field.name,
                    'minValue': field.min,
                    'maxValue': field.max,
                    'initialValue': this[field.parameter],
                    'setToSource': (value) => {
                        this[field.parameter] = value;
                        this._updateGeometry();
                    },
                    'getFromSource': () => { return this[field.parameter]; },
                });
            }
        }
        return menuFieldsMap;
    }

}

ProjectHandler.registerShape(PrimitiveBox, ASSET_ID, ASSET_NAME);
