/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { BoundingBox } from '/scripts/core/helpers/constants.js';
import { LineSegments } from 'three';

class Box3Helper extends LineSegments {

    constructor(box) {
        super(BoundingBox.geometry, BoundingBox.material);

        this.box = box;

        this.type = 'Box3Helper';

        this.geometry.computeBoundingSphere();

    }

    updateMatrixWorld( force ) {

        const box = this.box;

        if ( box.isEmpty() ) return;

        box.getCenter( this.position );

        box.getSize( this.scale );

        this.scale.multiplyScalar( 0.5 );

        super.updateMatrixWorld( force );

    }

}

export default Box3Helper;
