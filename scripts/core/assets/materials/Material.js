/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import { Textures, SIDE_MAP, REVERSE_SIDE_MAP } from '/scripts/core/helpers/constants.js';
import { uuidv4, numberOr, disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import MaterialHelper from '/scripts/core/helpers/editor/MaterialHelper.js';
import * as THREE from 'three';

export default class Material {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._name = ('name' in params)
            ? params['name']
            : this._getDefaultName();
        this._opacity = numberOr(params['opacity'], 1);
        this._side = params['side'] || THREE.FrontSide;
        this._transparent = params['transparent'] || false;
        if(global.isEditor) this._createEditorHelper();
    }

    _createEditorHelper() {
        this._editorHelper = new MaterialHelper(this);
    }

    _getDefaultName() {
        console.error("Material._getDefaultName() should be overridden");
        return;
    }

    _createMaterial() {
        console.error("Material._createMaterial() should be overridden");
        return;
    }

    _setTexture(param, newValue) {
        this['_' + param] = newValue;
        let texture = TexturesHandler.getTexture(newValue);
        this._material[param] = (texture)
            ? texture.getTexture()
            : null;
        this._material.needsUpdate = true;
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
            "opacity": this._material.opacity,
            "side": this._material.side,
            "transparent": this._material.transparent,
        };
    }

    _updateMaterialParamsWithMaps(params, maps) {
        for(let map of maps) {
            if(this['_' + map]) {
                let texture = TexturesHandler.getTexture(this['_' + map]);
                if(texture) params[map] = texture.getTexture();
            }
        }
    }

    dispose() {
        disposeMaterial(this._material);
        if(global.isEditor) this._editorHelper.dispose();
    }

    undoDispose() {
        if(global.isEditor) this._editorHelper.undoDispose();
    }

    getMaps() {
        console.error("Material.getMaps() should be overridden");
        return;
    }

    getMaterial() {
        return this._material;
    }

    getMaterialType() {
        console.error("Material.getMaterialType() should be overridden");
        return;
    }

    getSampleTexture() {
        console.error("Material.getSampleTexture() should be overridden");
        return;
    }

    getId() {
        return this._id;
    }

    getEditorHelper() {
        return this._editorHelper;
    }

    getName() {
        return this._name;
    }

    getOpacity() {
        return this._opacity;
    }

    getSide() {
        return this._side;
    }

    getTransparent() {
        return this._transparent;
    }

    setName(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }

    setOpacity(opacity) {
        if(this._opacity == opacity) return;
        this._opacity = opacity;
        this._material.opacity = opacity;
    }

    setSide(side) {
        if(this._side == side) return;
        this._side = side;
        this._material.side = side;
        this._material.needsUpdate = true;
    }

    setTransparent(transparent) {
        if(this._transparent == transparent) return;
        this._transparent = transparent;
        this._material.transparent = transparent;
        this._material.needsUpdate = true;
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}
