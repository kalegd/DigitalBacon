/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Textures, SIDE_MAP, REVERSE_SIDE_MAP } from '/scripts/core/helpers/constants.js';
import { uuidv4, disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "name": "Transparent", "parameter": "transparent", "type": CheckboxInput},
    { "name": "Opacity", "parameter": "opacity", "min": 0, "max": 1,
        "type": NumberInput },
    { "name": "Display", "parameter": "side", "type": EnumInput,
        "options": [ "Front Side", "Back Side", "Both Sides" ],
        "map": SIDE_MAP, "reverseMap": REVERSE_SIDE_MAP },
];

export default class Material {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._name = ('name' in params)
            ? params['name']
            : this._getDefaultName();
        this._transparent = params['transparent'] || false;
        this._opacity = params['opacity'] || 1;
        this._side = params['display'] || THREE.FrontSide;
        this._addSubscriptions();
    }

    _getDefaultName() {
        console.error("Material._getDefaultName() should be overridden");
        return;
    }

    _createMaterial() {
        console.error("Material._createMaterial() should be overridden");
        return;
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
            "transparent": this._material.transparent,
            "opacity": this._material.opacity,
            "display": this._material.side,
        };
    }

    setFromParams(params) {
        console.warn("Unexpectedly trying to setFromParams() for Material...");
        //this._material.transparent = params['Transparent'];
        //this._material.opacity = params['Opacity'];
        //this._material.side = params['Display'];
        //PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, this);
    }

    getMenuFields(fields) {
        if(this._menuFields) return this._menuFields;

        let menuFieldsMap = this._getMenuFieldsMap();
        let menuFields = [];
        for(let field of fields) {
            if(field.name in menuFieldsMap) {
                menuFields.push(menuFieldsMap[field.name]);
            }
        }
        this._menuFields = menuFields;
        return menuFields;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = {};
        for(let field of FIELDS) {
            let menuField = this._createMenuField(field);
            if(menuField) menuFieldsMap[field.name] = menuField;
        }
        return menuFieldsMap;
    }

    _createMenuField(field) {
        if(field.type == CheckboxInput) {
            return new CheckboxInput({
                'title': field.name,
                'initialValue': this._material[field.parameter],
                'getFromSource': () => {
                    return this._material[field.parameter]; },
                'setToSource': (v) => {
                    this._material[field.parameter] = v;
                    this._material.needsUpdate = true;
                    this['_' + field.parameter] = v;
                },
            });
        } else if(field.type == ColorInput) {
            return new ColorInput({
                'title': field.name,
                'initialValue': this._material[field.parameter],
                'onUpdate': (color) => {
                    this._material[field.parameter].set(color);
                },
            });
        } else if(field.type == EnumInput) {
            return new EnumInput({
                'title': field.name,
                'options': field.options,
                'initialValue':
                    field.reverseMap[this._material[field.parameter]],
                'getFromSource': () => {
                    return field.reverseMap[this._material[
                        field.parameter]];
                },
                'setToSource': (v) => {
                    this._updateEnum(field.parameter, v, field.map);
                },
            });
        } else if(field.type == NumberInput) {
            return new NumberInput({
                'title': field.name,
                'minValue': field.min,
                'maxValue': field.max,
                'initialValue': this._material[field.parameter],
                'getFromSource': () => {
                    return this._material[field.parameter]; },
                'setToSource': (v) => {
                    this._material[field.parameter] = v;
                    this['_' + field.parameter] = v;
                },
            });
        } else if(field.type == TextureInput) {
            return new TextureInput({
                'title': field.name,
                'initialValue': this['_' + field.parameter],
                'filter': field.filter,
                'getFromSource': () => {
                    return this['_' + field.parameter]; },
                'setToSource': (v) => {
                    this._updateTexture(field.parameter, v);
                },
            });
        }
    }

    _updateEnum(parameter, option, map) {
        if(map) {
            this._material[parameter] = map[option];
            this['_' + parameter] = map[option];
        } else {
            this._material[parameter] = option;
            this['_' + parameter] = option;
        }
        this._material.needsUpdate = true;
    }

    _addSubscriptions() {
        let maps = this._getMaps();
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_DELETED, (e) => {
            let updatedMaps = [];
            for(let map of maps) {
                if(this['_' + map] == e.texture.getId()) {
                    this._updateTexture(map, null);
                    updatedMaps.push(map);
                }
            }
            if(e.undoRedoAction && updatedMaps.length > 0) {
                let undo = e.undoRedoAction.undo;
                e.undoRedoAction.undo = () => {
                    undo();
                    for(let map of updatedMaps) {
                        this._updateTexture(map, e.texture.getId());
                    }
                }
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_UPDATED, (texture) => {
            let textureId = texture.getId();
            for(let map of maps) {
                if(this['_' + map] == textureId) {
                    this._updateTexture(map, textureId);
                }
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_UPDATED);
    }

    _updateMaterialParamsWithMaps(params, maps) {
        for(let map of maps) {
            if(this['_' + map]) {
                let texture = TexturesHandler.getTexture(this['_' + map]);
                if(texture) params[map] = texture.getTexture();
            }
        }
    }

    _updateTexture(parameter, textureId) {
        this['_' + parameter] = textureId;
        let texture = TexturesHandler.getTexture(textureId);

        this._material[parameter] = (texture)
            ? texture.getTexture()
            : null;
        this._material.needsUpdate = true;
        PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, this);
    }

    dispose() {
        this._removeSubscriptions();
        disposeMaterial(this._material);
    }

    undoDispose() {
        this._addSubscriptions();
    }

    _getMaps() {
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

    getName() {
        return this._name;
    }

    setName(newName, isUndoRedo) {
        if(!newName || this._name == newName) return;
        let oldName = this._name;
        this._name = newName;
        PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, this);
        if(!isUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setName(oldName, true);
            }, () => {
                this.setName(newName, true);
            });
        }
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}
