/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ConeShape from '/scripts/core/assets/primitives/ConeShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';

const { CheckboxField, NumberField } = ShapeHelper.FieldTypes;

export default class ConeShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "visualEdit",
        "material",
        { "parameter": "height", "name": "Height", "min": 0,
            "type": NumberField },
        { "parameter": "radius", "name": "Radius", "min": 0,
            "type": NumberField },
        { "parameter": "radialSegments", "name": "Sides", "min": 3,
            "type": NumberField },
        { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
            "type": NumberField },
        { "parameter": "thetaLength", "name": "Degrees", "min": 0, "max": 360,
            "type": NumberField },
        { "parameter": "openEnded", "name": "Open Ended", "type":CheckboxField},
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(ConeShapeHelper, ConeShape);
