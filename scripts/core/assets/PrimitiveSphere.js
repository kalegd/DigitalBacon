/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = '423c9506-52f4-4725-b848-69913cce2b00';
const ASSET_NAME = 'Sphere';
const FIELDS = [
    { "name": "Edit Visually" },
    { "name": "Material" },
    { "name": "Radius", "parameter": "_radius", "min": 0,
        "type": NumberInput },
    { "name": "Horizontal Sides", "parameter": "_widthSegments", "min": 3,
        "type": NumberInput },
    { "name": "Vertical Sides", "parameter": "_heightSegments", "min": 2,
        "type": NumberInput },
    { "name": "Horizontal Degrees", "parameter": "_phiLength", "min": 0,
        "max": 360, "type": NumberInput },
    { "name": "Vertical Degrees", "parameter": "_thetaLength", "min": 0,
        "max": 180, "type": NumberInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitiveSphere extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._radius = params['radius'] || 0.1;
        this._widthSegments = params['widthSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 16;
        this._phiLength = params['phiLength'] || 360;
        this._thetaLength = params['thetaLength'] || 180;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let phiLength = this._phiLength * Math.PI / 180;
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.SphereGeometry(this._radius,
            this._widthSegments, this._heightSegments, 0, phiLength, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let phiLength = this._phiLength * Math.PI / 180;
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.SphereGeometry(this._radius,
            this._widthSegments, this._heightSegments, 0, phiLength, 0,
            thetaLength);
        this._mesh.geometry = geometry;
        oldGeometry.dispose();
    }

    place(intersection) {
        //TODO: Depenetrate from the face using normal and bounding box
        super.place(intersection);
    }

    exportParams() {
        let params = super.exportParams();
        params['radius'] = this._radius;
        params['widthSegments'] = this._widthSegments;
        params['heightSegments'] = this._heightSegments;
        params['phiLength'] = this._phiLength;
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

ProjectHandler.registerShape(PrimitiveSphere, ASSET_ID, ASSET_NAME);
