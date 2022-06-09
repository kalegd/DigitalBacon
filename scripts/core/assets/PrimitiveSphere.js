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

const ASSET_ID = '423c9506-52f4-4725-b848-69913cce2b00';
const ASSET_NAME = 'Sphere';
const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "radius", "name": "Radius", "min": 0,
        "type": NumberInput },
    { "parameter": "widthSegments", "name": "Horizontal Sides", "min": 3,
        "type": NumberInput },
    { "parameter": "heightSegments", "name": "Vertical Sides", "min": 2,
        "type": NumberInput },
    { "parameter": "phiLength", "name": "Horizontal Degrees", "min": 0,
        "max": 360, "type": NumberInput },
    { "parameter": "thetaLength", "name": "Vertical Degrees", "min": 0,
        "max": 180, "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveSphere extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._radius = numberOr(params['radius'], 0.1);
        this._widthSegments = params['widthSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 16;
        this._phiLength = numberOr(params['phiLength'], 360);
        this._thetaLength = numberOr(params['thetaLength'], 180);
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

ProjectHandler.registerShape(PrimitiveSphere, ASSET_ID, ASSET_NAME);
