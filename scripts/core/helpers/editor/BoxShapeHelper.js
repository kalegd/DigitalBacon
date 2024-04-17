/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BoxShape from '/scripts/core/assets/primitives/BoxShape.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ShapeHelper from '/scripts/core/helpers/editor/ShapeHelper.js';

const { NumberField } = ShapeHelper.FieldTypes;

export default class BoxShapeHelper extends ShapeHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "visualEdit" },
        { "parameter": "material" },
        { "parameter": "width", "name": "Width", "min": 0,
            "type": NumberField },
        { "parameter": "height", "name": "Height", "min": 0,
            "type": NumberField },
        { "parameter": "depth", "name": "Depth", "min": 0,
            "type": NumberField },
        { "parameter": "widthSegments", "name": "Width Segments", "min": 1,
            "type": NumberField },
        { "parameter": "heightSegments", "name": "Height Segments", "min": 1,
            "type": NumberField },
        { "parameter": "depthSegments", "name": "Depth Segments", "min": 1,
            "type": NumberField },
        { "parameter": "parentId" },
        { "parameter": "position" },
        { "parameter": "rotation" },
        { "parameter": "scale" },
    ];
}

EditorHelperFactory.registerEditorHelper(BoxShapeHelper, BoxShape);
