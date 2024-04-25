/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import SphereShape from '/scripts/core/assets/primitives/SphereShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';

const { NumberField } = ShapeHelper.FieldTypes;

export default class SphereShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "visualEdit",
        "materialId",
        { "parameter": "radius", "name": "Radius", "min": 0,
            "type": NumberField },
        { "parameter": "widthSegments", "name": "Horizontal Sides", "min": 3,
            "type": NumberField },
        { "parameter": "heightSegments", "name": "Vertical Sides", "min": 2,
            "type": NumberField },
        { "parameter": "phiLength", "name": "Horizontal Degrees", "min": 0,
            "max": 360, "type": NumberField },
        { "parameter": "thetaLength", "name": "Vertical Degrees", "min": 0,
            "max": 180, "type": NumberField },
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(SphereShapeHelper, SphereShape);
