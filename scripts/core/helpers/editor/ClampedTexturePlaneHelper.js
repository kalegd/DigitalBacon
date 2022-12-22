/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import AssetHelper from '/scripts/core/helpers/editor/AssetHelper.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';

const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "doubleSided", "name": "Double Sided",
        "suppressMenuFocusEvent": true, "type": CheckboxInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class ClampedTexturePlaneHelper extends AssetHelper {
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
        menuFieldsMap['doubleSided'] = this._createCheckboxInput({
            name: 'Double Sided',
            parameter: 'doubleSided',
            suppressMenuFocusEvent: true
        });
        return menuFieldsMap;
    }
}
