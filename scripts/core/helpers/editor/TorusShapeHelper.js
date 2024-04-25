/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TorusShape from '/scripts/core/assets/primitives/TorusShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';

const { NumberField } = ShapeHelper.FieldTypes;

export default class TorusShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "visualEdit",
        "materialId",
        { "parameter": "radius", "name": "Radius", "min": 0,
            "type": NumberField },
        { "parameter": "tube", "name": "Tube Radius", "min": 0,
            "type": NumberField },
        { "parameter": "radialSegments", "name": "Radial Sides", "min": 2,
            "type": NumberField },
        { "parameter": "tubularSegments", "name": "Tubular Sides", "min": 3,
            "type": NumberField },
        { "parameter": "arc", "name": "Degrees", "min": 0, "max": 360,
            "type": NumberField },
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(TorusShapeHelper, TorusShape);
