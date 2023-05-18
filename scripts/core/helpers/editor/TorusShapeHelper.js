/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TorusShape from '/scripts/core/assets/primitives/TorusShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

export default class TorusShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "visualEdit" },
        { "parameter": "material" },
        { "parameter": "radius", "name": "Radius", "min": 0,
            "type": NumberInput },
        { "parameter": "tube", "name": "Tube Radius", "min": 0,
            "type": NumberInput },
        { "parameter": "radialSegments", "name": "Radial Sides", "min": 2,
            "type": NumberInput },
        { "parameter": "tubularSegments", "name": "Tubular Sides", "min": 3,
            "type": NumberInput },
        { "parameter": "arc", "name": "Degrees", "min": 0, "max": 360,
            "type": NumberInput },
        { "parameter": "position" },
        { "parameter": "rotation" },
        { "parameter": "scale" },
    ];
}

EditorHelperFactory.registerEditorHelper(TorusShapeHelper, TorusShape);
