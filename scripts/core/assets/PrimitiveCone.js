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

const ASSET_ID = '42779f01-e2cc-495a-a4b3-b286197fa762';
const ASSET_NAME = 'Cone';
const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "height", "name": "Height", "min": 0,
        "type": NumberInput },
    { "parameter": "radius", "name": "Radius", "min": 0,
        "type": NumberInput },
    { "parameter": "radialSegments", "name": "Sides", "min": 3,
        "type": NumberInput },
    { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "thetaLength", "name": "Degrees", "min": 0, "max": 360,
        "type": NumberInput },
    { "parameter": "openEnded", "name": "Open Ended", "type": CheckboxInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveCone extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._height = numberOr(params['height'], 0.2);
        this._radius = numberOr(params['radius'], 0.1);
        this._radialSegments = params['radialSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._openEnded = params['openEnded'] || false;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.ConeGeometry(this._radius, this._height,
            this._radialSegments, this._heightSegments, this._openEnded, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.ConeGeometry(this._radius, this._height,
            this._radialSegments, this._heightSegments, this._openEnded, 0,
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
        params['height'] = this._height;
        params['radius'] = this._radius;
        params['radialSegments'] = this._radialSegments;
        params['heightSegments'] = this._heightSegments;
        params['thetaLength'] = this._thetaLength;
        params['openEnded'] = this._openEnded;
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
            } else if(field.type == CheckboxInput) {
                menuFieldsMap[field.parameter] =
                    this._createGeometryCheckboxInput(field);
            }
        }
        return menuFieldsMap;
    }

}

ProjectHandler.registerShape(PrimitiveCone, ASSET_ID, ASSET_NAME);
