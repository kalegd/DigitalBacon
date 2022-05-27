/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import * as THREE from 'three';

const DEFAULT_SIZE = 1;
const FIELDS = [
    { "name": "Visually Edit" },
    { "name": "Double Sided", "type": CheckboxInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class ClampedTexturePlane extends Asset {
    constructor(params = {}) {
        super(params);
        this._createMesh(params['assetId']);
        this._doubleSided = !(params.doubleSided == false);
        if(!this._doubleSided) this._updateDoubleSided(false);
        this._transparent = params['transparent'] != false;
        if(!this._transparent) this._updateTransparent(false);
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh(assetId) {
        this._mesh = LibraryHandler.cloneMesh(assetId);
        this._object.add(this._mesh);
    }

    _updateDoubleSided(isDoubleSided) {
        if(!this._materialAlreadyCloned) {
            this._mesh.material = this._mesh.material.clone();
            this._materialAlreadyCloned = true;
        }
        this._mesh.material.side = (isDoubleSided)
            ? THREE.DoubleSide
            : THREE.FrontSide;
        this._doubleSided = isDoubleSided;
    }

    _updateTransparent(isTransparent) {
        if(!this._materialAlreadyCloned) {
            this._mesh.material = this._mesh.material.clone();
            this._materialAlreadyCloned = true;
        }
        this._mesh.material.transparent = isTransparent;
        this._transparent = isTransparent;
     }

    place(intersection) {
        let object = intersection.object;
        let point = intersection.point;
        let face = intersection.face;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld);
        this._object.position.copy(normal)
            .clampLength(0, 0.001)
            .add(point);
        this._object.lookAt(normal.add(this._object.position));
        this.roundAttributes();
    }

    clone(enableInteractablesOverride) {
        let params = this._fetchCloneParams(enableInteractablesOverride);
        return ProjectHandler.addImage(params);
    }

    exportParams() {
        let params = super.exportParams();
        params['doubleSided'] = this._mesh.material.side == THREE.DoubleSide;
        params['transparent'] = this._transparent;
        return params;
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.name in menuFieldsMap) {
                continue;
            } else if(field.name == "Double Sided") {
                let params = {};
                params['title'] = field.name;
                params['initialValue'] =
                    this._mesh.material.side == THREE.DoubleSide;
                params['getFromSource'] = () => {
                    return this._mesh.material.side == THREE.DoubleSide; };
                params['setToSource'] = (v) => { this._updateDoubleSided(v); };
                params['suppressMenuFocusEvent'] = true;
                let menuField = new field.type(params)
                menuFieldsMap[field.name] = menuField;
            }
        }
        return menuFieldsMap;
    }
}
