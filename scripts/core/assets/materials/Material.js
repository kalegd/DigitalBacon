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
import { uuidv4, numberOr, disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "parameter": "transparent", "name": "Transparent", "type": CheckboxInput},
    { "parameter": "opacity", "name": "Opacity", "min": 0, "max": 1,
        "type": NumberInput },
    { "parameter": "side", "name": "Display", "type": EnumInput,
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
        this._opacity = numberOr(params['opacity'], 1);
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

    _updateColorParameter(param, oldValue, newValue, ignoreUndoRedo, ignorePublish) {
        let currentValue = this._material[param].getHex();
        if(currentValue != newValue) {
            this._material[param].setHex(newValue);
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, this);
        }
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._updateColorParameter(param, null, oldValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateColorParameter(param, null, newValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateMaterialParameter(needsUpdate, param, oldValue, newValue,
                             ignoreUndoRedo, ignorePublish)
    {
        let currentValue = this._material[param];
        if(currentValue != newValue) {
            this._material[param] = newValue;
            this['_' + param] = newValue;
            if(needsUpdate) this._material.needsUpdate = true;
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, this);
        }
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateMaterialParameter(needsUpdate, param, null,
                    oldValue, true, ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateMaterialParameter(needsUpdate, param, null,
                    newValue, true, ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateMaterialTexture(param, newValue, ignoreUndoRedo, ignorePublish) {
        let oldValue = this['_' + param];
        if(oldValue == newValue) return;

        this._updateTexture(param, newValue);

        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, this);
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateMaterialTexture(param, oldValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateMaterialTexture(param, newValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateTexture(param, newValue) {
        this['_' + param] = newValue;
        let texture = TexturesHandler.getTexture(newValue);
        this._material[param] = (texture)
            ? texture.getTexture()
            : null;
        this._material.needsUpdate = true;
    }

    _updateMenuField(param) {
        if(!this._menuFields) return;
        let menuField = this._menuFieldsMap[param];
        if(menuField) menuField.updateFromSource();
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

        this._menuFieldsMap = this._getMenuFieldsMap();
        let menuFields = [];
        for(let field of fields) {
            if(field.parameter in this._menuFieldsMap) {
                menuFields.push(this._menuFieldsMap[field.parameter]);
            }
        }
        this._menuFields = menuFields;
        return menuFields;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = {};
        for(let field of FIELDS) {
            let menuField = this._createMenuField(field);
            if(menuField) menuFieldsMap[field.parameter] = menuField;
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
                'onUpdate': (newValue) => {
                    this._updateMaterialParameter(true, field.parameter,
                        this._material[field.parameter], newValue);
                },
            });
        } else if(field.type == ColorInput) {
            return new ColorInput({
                'title': field.name,
                'initialValue': this._material[field.parameter].getHex(),
                'onBlur': (oldValue, newValue) => {
                    this._updateColorParameter(field.parameter, oldValue,
                        newValue);
                },
                'onUpdate': (newValue) => {
                    this._updateColorParameter(field.parameter,
                        this._material[field.parameter].getHex(), newValue,
                        true);
                },
                'getFromSource': () => {
                    return this._material[field.parameter].getHex();
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
                'onUpdate': (v) => {
                    this._updateMaterialParameter(true, field.parameter,
                        this._material[field.parameter],
                        field.map[v]);
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
                'onBlur': (oldValue, newValue) => {
                    this._updateMaterialParameter(false, field.parameter,
                        oldValue, newValue);
                },
                'onUpdate': (newValue) => {
                    this._updateMaterialParameter(false, field.parameter,
                        this._material[field.parameter], newValue, true);
                },
            });
        } else if(field.type == TextureInput) {
            return new TextureInput({
                'title': field.name,
                'initialValue': this['_' + field.parameter],
                'filter': field.filter,
                'getFromSource': () => {
                    return this['_' + field.parameter]; },
                'onUpdate': (newValue) => {
                    this._updateMaterialTexture(field.parameter, newValue);
                },
            });
        }
    }

    _addSubscriptions() {
        let maps = this._getMaps();
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_DELETED, (e) => {
            let updatedMaps = [];
            for(let map of maps) {
                if(this['_' + map] == e.texture.getId()) {
                    this._updateTexture(map);
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
