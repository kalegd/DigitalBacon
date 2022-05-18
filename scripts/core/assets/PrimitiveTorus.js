/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = '6b8bcbf1-49b0-42ce-9d60-9a7db6e425bf';
const ASSET_NAME = 'Torus';
const FIELDS = [
    { "name": "Edit Visually" },
    { "name": "Material" },
    { "name": "Radius", "parameter": "_radius", "min": 0,
        "type": NumberInput },
    { "name": "Tube Radius", "parameter": "_tube", "min": 0,
        "type": NumberInput },
    { "name": "Radial Sides", "parameter": "_radialSegments", "min": 2,
        "type": NumberInput },
    { "name": "Tubular Sides", "parameter": "_tubularSegments", "min": 3,
        "type": NumberInput },
    { "name": "Degrees", "parameter": "_arc", "min": 0, "max": 360,
        "type": NumberInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitiveTorus extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._radius = params['radius'] || 0.1;
        this._tube = params['tube'] || 0.05;
        this._radialSegments = params['radialSegments'] || 16;
        this._tubularSegments = params['tubularSegments'] || 32;
        this._arc = params['arc'] || 360;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let arc = this._arc * Math.PI / 180;
        let geometry = new THREE.TorusGeometry(this._radius, this._tube,
            this._radialSegments, this._tubularSegments, arc);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let arc = this._arc * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.TorusGeometry(this._radius, this._tube,
            this._radialSegments, this._tubularSegments, arc);
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
        params['tube'] = this._tube;
        params['radialSegments'] = this._radialSegments;
        params['tubularSegments'] = this._tubularSegments;
        params['arc'] = this._arc;
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

ProjectHandler.registerShape(PrimitiveTorus, ASSET_ID, ASSET_NAME);
