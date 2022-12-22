/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveMeshHelper from '/scripts/core/helpers/editor/PrimitiveMeshHelper.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

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

export default class PrimitivePlaneHelper extends PrimitiveMeshHelper {
    constructor(asset) {
        super(asset);
    }

    place(intersection) {
        let object = intersection.object;
        let point = intersection.point;
        let face = intersection.face;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld).clampLength(0, 0.001);
        if(global.camera.getWorldDirection(vector3s[0]).dot(normal) > 0)
            normal.negate();
        this._object.position.copy(normal).add(point);
        this._object.lookAt(normal.add(this._object.position));
        this.roundAttributes(true);
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) {
                continue;
            } else {
                let input = this._createStandardInput(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }
}
