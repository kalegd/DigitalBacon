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

const ASSET_ID = '534f29c3-1e85-4510-bb84-459011de6722';
const ASSET_NAME = 'Ring';
const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "material" },
    { "parameter": "innerRadius", "name": "Inner Radius", "min": 0,
        "type": NumberInput },
    { "parameter": "outerRadius", "name": "Outer Radius", "min": 0,
        "type": NumberInput },
    { "parameter": "thetaSegments", "name": "Sides", "min": 3,
        "type": NumberInput },
    { "parameter": "phiSegments", "name": "Radius Segments", "min": 1,
        "type": NumberInput },
    { "parameter": "thetaLength", "name": "Degrees", "min": 0, "max": 360,
        "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveRing extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._innerRadius = numberOr(params['innerRadius'], 0.05);
        this._outerRadius = numberOr(params['outerRadius'], 0.1);
        this._thetaSegments = params['thetaSegments'] || 32;
        this._phiSegments = params['phiSegments'] || 1;
        this._thetaLength = numberOr(params['thetaLength'], 360);
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.RingGeometry(this._innerRadius,
            this._outerRadius, this._thetaSegments, this._phiSegments, 0,
            thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.RingGeometry(this._innerRadius,
            this._outerRadius, this._thetaSegments, this._phiSegments, 0,
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
        this.roundAttributes(true);
    }

    exportParams() {
        let params = super.exportParams();
        params['innerRadius'] = this._innerRadius;
        params['outerRadius'] = this._outerRadius;
        params['thetaSegments'] = this._thetaSegments;
        params['phiSegments'] = this._phiSegments;
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

ProjectHandler.registerShape(PrimitiveRing, ASSET_ID, ASSET_NAME);
