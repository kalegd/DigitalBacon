/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMesh from '/scripts/core/assets/PrimitiveMesh.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const ASSET_ID = 'f4efc996-0d50-48fe-9313-3c7b1a5c1754';
const ASSET_NAME = 'Cylinder';
const FIELDS = [
    { "name": "Visually Edit" },
    { "name": "Material" },
    { "name": "Height", "parameter": "_height", "min": 0,
        "type": NumberInput },
    { "name": "Top Radius", "parameter": "_radiusTop", "min": 0,
        "type": NumberInput },
    { "name": "Bottom Radius", "parameter": "_radiusBottom", "min": 0,
        "type": NumberInput },
    { "name": "Sides", "parameter": "_radialSegments", "min": 3,
        "type": NumberInput },
    { "name": "Height Segments", "parameter": "_heightSegments", "min": 1,
        "type": NumberInput },
    { "name": "Degrees", "parameter": "_thetaLength", "min": 0, "max": 360,
        "type": NumberInput },
    { "name": "Open Ended", "parameter": "_openEnded", "type": CheckboxInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitiveCylinder extends PrimitiveMesh {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._height = params['height'] || 0.2;
        this._radiusTop = params['radiusTop'] || 0.1;
        this._radiusBottom = params['radiusBottom'] || 0.1;
        this._radialSegments = params['radialSegments'] || 32;
        this._heightSegments = params['heightSegments'] || 1;
        this._thetaLength = params['thetaLength'] || 360;
        this._openEnded = params['openEnded'] || false;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let geometry = new THREE.CylinderGeometry(this._radiusTop,
            this._radiusBottom, this._height, this._radialSegments,
            this._heightSegments, this._openEnded, 0, thetaLength);
        this._mesh = new THREE.Mesh(geometry, this._getMaterial());
        this._object.add(this._mesh);
    }

    _updateGeometry() {
        let thetaLength = this._thetaLength * Math.PI / 180;
        let oldGeometry = this._mesh.geometry;
        let geometry = new THREE.CylinderGeometry(this._radiusTop,
            this._radiusBottom, this._height, this._radialSegments,
            this._heightSegments, this._openEnded, 0, thetaLength);
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
        params['radiusTop'] = this._radiusTop;
        params['radiusBottom'] = this._radiusBottom;
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
            } else if(field.type == CheckboxInput) {
                let update = (value) => {
                    this[field.parameter] = value;
                    this._updateGeometry();
                };
                menuFieldsMap[field.name] = new CheckboxInput({
                    'title': field.name,
                    'initialValue': this[field.parameter],
                    'setToSource': update,
                    'getFromSource': () => { return this[field.parameter]; },
                });
            }
        }
        return menuFieldsMap;
    }

}

ProjectHandler.registerShape(PrimitiveCylinder, ASSET_ID, ASSET_NAME);
