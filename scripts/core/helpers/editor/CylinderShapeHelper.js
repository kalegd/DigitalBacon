/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import CylinderShape from '/scripts/core/assets/primitives/CylinderShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

export default class CylinderShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "visualEdit" },
        { "parameter": "material" },
        { "parameter": "height", "name": "Height", "min": 0,
            "type": NumberInput },
        { "parameter": "radiusTop", "name": "Top Radius", "min": 0,
            "type": NumberInput },
        { "parameter": "radiusBottom", "name": "Bottom Radius", "min": 0,
            "type": NumberInput },
        { "parameter": "radialSegments", "name": "Sides", "min": 3,
            "type": NumberInput },
        { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
            "type": NumberInput },
        { "parameter": "thetaLength", "name": "Degrees", "min": 0, "max": 360,
            "type": NumberInput },
        { "parameter": "openEnded", "name": "Open Ended", "type":CheckboxInput},
        { "parameter": "parentId" },
        { "parameter": "position" },
        { "parameter": "rotation" },
        { "parameter": "scale" },
    ];
}

EditorHelperFactory.registerEditorHelper(CylinderShapeHelper, CylinderShape);
