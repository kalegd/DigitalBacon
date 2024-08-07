/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PlaneShape from '/scripts/core/assets/primitives/PlaneShape.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';

const { NumberField } = ShapeHelper.FieldTypes;

export default class PlaneShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    place(intersection) {
        let { object, point } = intersection;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld).clampLength(0, 0.001);
        if(global.camera.getWorldDirection(vector3s[0]).dot(normal) > 0)
            normal.negate();
        point.add(normal);
        this._object.position.copy(point);
        this._object.parent.worldToLocal(this._object.position);
        point.add(normal);
        this._object.lookAt(point);
        this.roundAttributes(true);
    }

    static fields = [
        "visualEdit",
        "materialId",
        { "parameter": "width", "name": "Width", "min": 0, "type": NumberField},
        { "parameter": "height", "name": "Height", "min": 0,"type":NumberField},
        { "parameter": "widthSegments", "name": "Width Segments", "min": 1,
            "type": NumberField },
        { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
            "type": NumberField },
        "parentId",
        "position",
        "rotation",
        "scale",
        "renderOrder",
    ];
}

EditorHelperFactory.registerEditorHelper(PlaneShapeHelper, PlaneShape);
