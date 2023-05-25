/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { capitalizeFirstLetter } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import AudioInput from '/scripts/core/menu/input/AudioInput.js';
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
    AudioInput: "_createAudioInput",
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

    addComponent(componentId, ignorePublish, ignoreUndoRedo) {
        let component = this._asset.addComponent(componentId, ignorePublish);
        if(!component) {
            component = ProjectHandler.getSessionAsset(componentId);
            if(!component) return;
            this._deletedAttachedComponents.add(component);
            if(!ignorePublish) {
                this._publishComponentAttachment(
                    PubSubTopics.COMPONENT_ATTACHED, component);
            }
        }
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.removeComponent(componentId, ignorePublish, true);
            }, () => {
                this.addComponent(componentId, ignorePublish, true);
            });
        }
    }

    removeComponent(componentId, ignorePublish, ignoreUndoRedo) {
        let component = this._asset.removeComponent(componentId, ignorePublish);
        if(!component) {
            component = ProjectHandler.getSessionAsset(componentId);
            if(!component) return;
            this._deletedAttachedComponents.delete(component);
            if(!ignorePublish) {
                this._publishComponentAttachment(
                    PubSubTopics.COMPONENT_DETACHED, component);
            }
        }
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.addComponent(componentId, ignorePublish, true);
            }, () => {
                this.removeComponent(componentId, ignorePublish, true);
            });
        }
    }

    _publishComponentAttachment(topicPrefix, component) {
        let componentAssetId = component.getAssetId();
        let topic = topicPrefix + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
            assetId: this._asset.getAssetId(),
            assetType: this._asset.constructor.assetType,
            componentId: component.getId(),
            componentAssetId: componentAssetId,
        });
    }

    _addComponentSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ADDED, (component) =>{
            if(this._deletedAttachedComponents.has(component)) {
                this._deletedAttachedComponents.delete(component);
                this._asset._components.add(component);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DELETED, (message) =>{
            let component = message.asset;
            if(this._asset._components.has(component)) {
                this._deletedAttachedComponents.add(component);
                this._asset._components.delete(component);
            }
        });
    }

    getMenuFields() {
        let thisClass = this.constructor;
        if(!thisClass.fields) return [];
        if(this._menuFields) return this._menuFields;

        this._menuFieldsMap = this._getMenuFieldsMap(thisClass);
        let menuFields = [];
        for(let field of thisClass.fields) {
            if(field.parameter in this._menuFieldsMap) {
                menuFields.push(this._menuFieldsMap[field.parameter]);
            }
        }
        this._menuFields = menuFields;
        return menuFields;
    }

    _getMenuFieldsMap(helperClass) {
        if(!helperClass) return {};
        let parentClass = Object.getPrototypeOf(helperClass);
        let menuFieldsMap = this._getMenuFieldsMap(parentClass);
        if(!helperClass.fields) return menuFieldsMap;
        for(let field of helperClass.fields) {
            if(field.parameter in menuFieldsMap) {
                continue;
            } else {
                let input = this._createStandardInput(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }

    _createStandardInput(field) {
        if(field.type.name in INPUT_TYPE_TO_CREATE_FUNCTION) {
            return this[INPUT_TYPE_TO_CREATE_FUNCTION[field.type.name]](field);
        }
    }

    _createAudioInput(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new AudioInput({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => { return this._asset[getFunction](); },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
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
            'initialValue': this._getKeyFromValue(field.map,
                this._asset[getFunction]()),
            'options': Object.keys(field.map),
            'getFromSource': () => {
                return this._getKeyFromValue(field.map,
                    this._asset[getFunction]());
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

    _getKeyFromValue(map, value) {
        for(let key in map) {
            if(map[key] == value) return key;
        }
    }
}

EditorHelperFactory.registerEditorHelper(EditorHelper, Asset);
