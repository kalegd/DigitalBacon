/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = '0a0c7c21-d834-4a88-9234-0d9b5cf705f6';
const ASSET_NAME = 'Circle';
const FIELDS = [
    { "name": "Visually Edit" },
    { "name": "Material" },
    { "name": "Radius", "parameter": "_radius", "min": 0, "type": NumberInput },
    { "name": "Sides", "parameter": "_segments", "min": 3,
        "type": NumberInput },
    { "name": "Degrees", "parameter": "_thetaLength", "min": 0, "max": 360,
        "type": NumberInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitiveCircle extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._radius = params['radius'] || 0.1;
        this._segments = params['segments'] || 32;
        this._thetaLength = params['thetaLength'] || 360;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
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
        params['radius'] = this._radius;
        params['segments'] = this._segments;
        params['thetaLength'] = this._thetaLength;
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

ProjectHandler.registerShape(PrimitiveCircle, ASSET_ID, ASSET_NAME);
