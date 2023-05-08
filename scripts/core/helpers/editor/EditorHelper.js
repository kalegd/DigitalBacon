/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { capitalizeFirstLetter } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import CubeImageInput from '/scripts/core/menu/input/CubeImageInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import EulerInput from '/scripts/core/menu/input/EulerInput.js';
import ImageInput from '/scripts/core/menu/input/ImageInput.js';
import MaterialInput from '/scripts/core/menu/input/MaterialInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import Vector2Input from '/scripts/core/menu/input/Vector2Input.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';

const INPUT_TYPE_TO_CREATE_FUNCTION = {
    CheckboxInput: "_createCheckboxInput",
    ColorInput: "_createColorInput",
    CubeImageInput: "_createCubeImageInput",
    EnumInput: "_createEnumInput",
    EulerInput: "_createEulerInput",
    ImageInput: "_createImageInput",
    MaterialInput: "_createMaterialInput",
    NumberInput: "_createNumberInput",
    TextureInput: "_createTextureInput",
    Vector2Input: "_createVector2Input",
    Vector3Input: "_createVector3Input",
};

export default class EditorHelper {
    constructor(asset, updatedTopic) {
        this._asset = asset;
        this._id = asset.getId();
        this._updatedTopic = updatedTopic;
        this._deletedAttachedComponents = new Set();
        this._addComponentSubscriptions();
    }

    _publish(params) {
        let message = { asset: this._asset, fields: params };
        PubSub.publish(this._id, this._updatedTopic, message);
    }

    _updateCubeImage(param, side, newValue, ignoreUndoRedo, ignorePublish,
                     oldValue) {
        let capitalizedParam = capitalizeFirstLetter(param);
        let currentValue = this._asset['get' + capitalizedParam]()[side];
        if(currentValue != newValue) {
            this._asset['set' + capitalizedParam](newValue, side);
            if(!ignorePublish)
                this._publish([param]);
        }
        if(!oldValue) oldValue = currentValue;
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateCubeImage(param, side, oldValue, true,
                                      ignorePublish);
                this.updateMenuField(param);
            }, () => {
                this._updateCubeImage(param, side, newValue, true,
                                      ignorePublish);
                this.updateMenuField(param);
            });
        }
    }

    _updateEuler(param, newValue, ignoreUndoRedo, ignorePublish, oldValue) {
        this._updateVector3(param, newValue, ignoreUndoRedo, ignorePublish,
            oldValue);
    }

    _updateVector2(param, newValue, ignoreUndoRedo, ignorePublish, oldValue) {
        this._updateVector3(param, newValue, ignoreUndoRedo, ignorePublish,
            oldValue);
    }

    _updateVector3(param, newValue, ignoreUndoRedo, ignorePublish, oldValue) {
        let capitalizedParam = capitalizeFirstLetter(param);
        let currentValue = this._asset['get' + capitalizedParam]();
        if(!currentValue.reduce((a, v, i) => a && newValue[i] == v, true)) {
            this._asset['set' + capitalizedParam](newValue);
            if(!ignorePublish)
                this._publish([param]);
        }
        if(!oldValue) oldValue = currentValue;
        if(!ignoreUndoRedo && !oldValue
                .reduce((a,v,i) => a && newValue[i] == v,true))
        {
            UndoRedoHandler.addAction(() => {
                this._updateVector3(param, oldValue, true, ignorePublish);
                this.updateMenuField(param);
            }, () => {
                this._updateVector3(param, newValue, true, ignorePublish);
                this.updateMenuField(param);
            });
        }
    }

    _updateParameter(param, newValue, ignoreUndoRedo, ignorePublish, oldValue) {
        let capitalizedParam = capitalizeFirstLetter(param);
        let currentValue = this._asset['get' + capitalizedParam]();
        if(currentValue != newValue) {
            this._asset['set' + capitalizedParam](newValue);
            if(!ignorePublish)
                this._publish([param]);
        }
        if(oldValue == null) oldValue = currentValue;
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateParameter(param, oldValue, true, ignorePublish);
                this.updateMenuField(param);
            }, () => {
                this._updateParameter(param, newValue, true, ignorePublish);
                this.updateMenuField(param);
            });
        }
    }

    updateMenuField(param) {
        if(!this._menuFields) return;
        let menuField = this._menuFieldsMap[param];
        if(menuField) menuField.updateFromSource();
    }

    updateName(newName, ignoreUndoRedo) {
        let oldName = this._asset.getName();
        if(oldName == newName) return;
        this._asset.setName(newName);
        this._publish(['name']);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.updateName(oldName, true);
            }, () => {
                this.updateName(newName, true);
            });
        }
    }

    addComponent(componentId, ignoreUndoRedo) {
        let component = this._asset.addComponent(componentId);
        if(!component) return;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.removeComponent(componentId, true);
            }, () => {
                this.addComponent(componentId, true);
            });
        }
    }

    removeComponent(componentId, ignoreUndoRedo) {
        let component = this._asset.removeComponent(componentId);
        if(!component) return;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.addComponent(componentId, true);
            }, () => {
                this.removeComponent(componentId, true);
            });
        }
    }

    _addComponentSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ADDED, (component) =>{
            if(this._deletedAttachedComponents.has(component)) {
                this._deletedAttachedComponents.delete(component);
                this._asset.addComponent(component.getId(), true);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DELETED, (message) =>{
            let component = message.component;
            if(this._asset._components.has(component)) {
                this._deletedAttachedComponents.add(component);
                this._asset.removeComponent(component.getId(), true);
            }
        });
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
        return {};
    }

    _createStandardInput(field) {
        if(field.type.name in INPUT_TYPE_TO_CREATE_FUNCTION) {
            return this[INPUT_TYPE_TO_CREATE_FUNCTION[field.type.name]](field);
        }
    }

    _createCheckboxInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new CheckboxInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'suppressMenuFocusEvent': field.suppressMenuFocusEvent == true,
            'getFromSource': () => { return this._asset[getFunction](); },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createColorInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new ColorInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                                      oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, true);
            },
        });
    }

    _createCubeImageInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new CubeImageInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onUpdate': (side, newValue) => {
                this._updateCubeImage(field.parameter, side, newValue);
            },
        });
    }

    _createEnumInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new EnumInput({
            'title': field.name,
            'initialValue': field.reverseMap[this._asset[getFunction]()],
            'options': field.options,
            'getFromSource': () => {
                return field.reverseMap[this._asset[getFunction]()];
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, field.map[newValue]);
            },
        });
    }

    _createEulerInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new EulerInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onBlur': (oldValue, newValue) => {
                this._updateEuler(field.parameter, newValue, false, false,
                                  oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateEuler(field.parameter, newValue, true);
            },
        });
    }

    _createImageInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new ImageInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createMaterialInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new MaterialInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createNumberInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new NumberInput({
            'title': field.name,
            'minValue': field.min,
            'maxValue': field.max,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                                      oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, true);
            },
        });
    }

    _createTextureInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new TextureInput({
            'title': field.name,
            'filter': field.filter,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createVector2Input(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new Vector2Input({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onBlur': (oldValue, newValue) => {
                this._updateVector2(field.parameter, newValue, false, false,
                                  oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateVector2(field.parameter, newValue, true);
            },
        });
    }

    _createVector3Input(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new Vector3Input({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onBlur': (oldValue, newValue) => {
                this._updateVector3(field.parameter, newValue, false, false,
                                  oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateVector3(field.parameter, newValue, true);
            },
        });
    }
}

EditorHelperFactory.registerEditorHelper(EditorHelper, Asset);
