/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import RingShape from '/scripts/core/assets/primitives/RingShape.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';

const { NumberField } = ShapeHelper.FieldTypes;

export default class RingShapeHelper extends ShapeHelper {
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
        { "parameter": "innerRadius", "name": "Inner Radius", "min": 0,
            "type": NumberField },
        { "parameter": "outerRadius", "name": "Outer Radius", "min": 0,
            "type": NumberField },
        { "parameter": "thetaSegments", "name": "Sides", "min": 3,
            "type": NumberField },
        { "parameter": "phiSegments", "name": "Radius Segments", "min": 1,
            "type": NumberField },
        { "parameter": "thetaLength", "name": "Degrees", "min": 0, "max": 360,
            "type": NumberField },
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(RingShapeHelper, RingShape);
