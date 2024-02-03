/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '../../../scripts/core/global.js';
import Entity from '../../../scripts/core/assets/Entity.js';
import { matrix4 } from '../../../scripts/core/helpers/constants.js';
import { DoubleSide, Mesh, MeshBasicMaterial, BoxGeometry } from 'three';

class XRPlanes extends Entity {
    constructor() {
        super();
        this._object.renderOrder = -Infinity;
        this._planes = new Map();
        this._material = new MeshBasicMaterial({
            color: 0xffffff,
            colorWrite: false,
            side: DoubleSide,
        });
    }

    updatePlanes(event) {
        let frame = event.data;
        let detectedPlanes = frame.detectedPlanes;
        let referenceSpace = global.renderer.xr.getReferenceSpace();
        for(let [plane, details] of this._planes) {
            if(!detectedPlanes.has(plane)) {
                this._deletePlane(plane, details.mesh);
            }
        }

        for(let plane of detectedPlanes) {
            let details = this._planes.get(plane);
            if(!details) {
                this._addPlane(plane, frame, referenceSpace);
            } else if(plane.lastChangedTime != details.lastChangedTime) {
                this._deletePlane(plane, details.mesh);
                this._addPlane(plane, frame, referenceSpace);
            }
        }
    }

    _addPlane(plane, frame, referenceSpace) {
        let pose = frame.getPose(plane.planeSpace, referenceSpace);
        matrix4.fromArray(pose.transform.matrix);

        let minX = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let minZ = Number.MAX_SAFE_INTEGER;
        let maxZ = Number.MIN_SAFE_INTEGER;

        for (let point of plane.polygon) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minZ = Math.min(minZ, point.z);
            maxZ = Math.max(maxZ, point.z);
        }

        let width = maxX - minX;
        let height = maxZ - minZ;

        let geometry = new BoxGeometry(width, 0.01, height);

        let mesh = new Mesh(geometry, this._material);
        mesh.renderOrder = -Infinity;
        mesh.position.setFromMatrixPosition(matrix4);
        mesh.quaternion.setFromRotationMatrix(matrix4);
        this._object.add(mesh);

        let details = { lastChangedTime: plane.lastChangedTime, mesh: mesh };
        this._planes.set(plane, details);
    }

    _deletePlane(plane, mesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
        this._object.remove(mesh);
        this._planes.delete(plane);
    }
}

let xrPlanes = new XRPlanes();
export default xrPlanes;
