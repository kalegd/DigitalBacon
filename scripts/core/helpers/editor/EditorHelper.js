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
import AssetEntityField from '/scripts/core/menu/input/AssetEntityField.js';
import AudioField from '/scripts/core/menu/input/AudioField.js';
import CheckboxField from '/scripts/core/menu/input/CheckboxField.js';
import ColorField from '/scripts/core/menu/input/ColorField.js';
import CubeImageField from '/scripts/core/menu/input/CubeImageField.js';
import EnumField from '/scripts/core/menu/input/EnumField.js';
import EulerField from '/scripts/core/menu/input/EulerField.js';
import ImageField from '/scripts/core/menu/input/ImageField.js';
import MaterialField from '/scripts/core/menu/input/MaterialField.js';
import NumberField from '/scripts/core/menu/input/NumberField.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import TextureField from '/scripts/core/menu/input/TextureField.js';
import Vector2Field from '/scripts/core/menu/input/Vector2Field.js';
import Vector3Field from '/scripts/core/menu/input/Vector3Field.js';

const INPUT_TYPE_TO_CREATE_FUNCTION = {
    AssetEntityField: "_createAssetEntityField",
    AudioField: "_createAudioField",
    CheckboxField: "_createCheckboxField",
    ColorField: "_createColorField",
    CubeImageField: "_createCubeImageField",
    EnumField: "_createEnumField",
    EulerField: "_createEulerField",
    ImageField: "_createImageField",
    MaterialField: "_createMaterialField",
    NumberField: "_createNumberField",
    TextField: "_createTextField",
    TextureField: "_createTextureField",
    Vector2Field: "_createVector2Field",
    Vector3Field: "_createVector3Field",
};

export default class EditorHelper {
    constructor(asset, updatedTopic) {
        this._asset = asset;
        this._id = asset.getId();
        this._updatedTopic = updatedTopic + ':' + asset.getAssetId() + ':'
            + this._id;
        this._deletedAttachedComponents = new Set();
        this._addComponentSubscriptions();
    }

    _publish(params) {
        let message = { asset: this._asset, fields: params };
        PubSub.publish(this._id, this._updatedTopic, message);
    }

    _updateCubeImage(param, side, newValue, ignorePublish, ignoreUndoRedo,
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
                this._updateCubeImage(param, side, oldValue,ignorePublish,true);
                this.updateMenuField(param);
            }, () => {
                this._updateCubeImage(param, side, newValue,ignorePublish,true);
                this.updateMenuField(param);
            });
        }
    }

    _updateEuler(param, newValue, ignorePublish, ignoreUndoRedo, oldValue) {
        this._updateVector3(param, newValue, ignorePublish, ignoreUndoRedo,
            oldValue);
    }

    _updateVector2(param, newValue, ignorePublish, ignoreUndoRedo, oldValue) {
        this._updateVector3(param, newValue, ignorePublish, ignoreUndoRedo,
            oldValue);
    }

    _updateVector3(param, newValue, ignorePublish, ignoreUndoRedo, oldValue) {
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
                this._updateVector3(param, oldValue, ignorePublish, true);
                this.updateMenuField(param);
            }, () => {
                this._updateVector3(param, newValue, ignorePublish, true);
                this.updateMenuField(param);
            });
        }
    }

    _updateParameter(param, newValue, ignorePublish, ignoreUndoRedo, oldValue) {
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
                this._updateParameter(param, oldValue, ignorePublish, true);
                this.updateMenuField(param);
            }, () => {
                this._updateParameter(param, newValue, ignorePublish, true);
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
        return component;
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
        return component;
    }

    _publishComponentAttachment(topicPrefix, component) {
        let componentAssetId = component.getAssetId();
        let topic = topicPrefix + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
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
                let input = this._createStandardField(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }

    _createStandardField(field) {
        if(field.type.name in INPUT_TYPE_TO_CREATE_FUNCTION) {
            return this[INPUT_TYPE_TO_CREATE_FUNCTION[field.type.name]](field);
        }
    }

    _createAssetEntityField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new AssetEntityField({
            'title': field.name,
            'exclude': field.excludeSelf ? this._id : null,
            'filter': typeof field.filter == 'function' ? field.filter : null,
            'includeScene': field.includeScene,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createAudioField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new AudioField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createCheckboxField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new CheckboxField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'suppressMenuFocusEvent': field.suppressMenuFocusEvent == true,
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createColorField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new ColorField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _createCubeImageField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new CubeImageField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (side, newValue) => {
                this._updateCubeImage(field.parameter, side, newValue);
            },
        });
    }

    _createEnumField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new EnumField({
            'title': field.name,
            'initialValue': this._getKeyFromValue(field.map,
                this._asset[getFunction]()),
            'options': Object.keys(field.map),
            'getFromSource': () => this._getKeyFromValue(field.map,
                this._asset[getFunction]()),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, field.map[newValue]);
            },
        });
    }

    _createEulerField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new EulerField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onBlur': (oldValue, newValue) => {
                this._updateEuler(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateEuler(field.parameter, newValue, false, true);
            },
        });
    }

    _createImageField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new ImageField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createMaterialField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new MaterialField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createNumberField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new NumberField({
            'title': field.name,
            'minValue': field.min,
            'maxValue': field.max,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _createTextField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new TextField({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'singleLine': field.singleLine,
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _createTextureField(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new TextureField({
            'title': field.name,
            'filter': field.filter,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createVector2Field(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new Vector2Field({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onBlur': (oldValue, newValue) => {
                this._updateVector2(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateVector2(field.parameter, newValue, false, true);
            },
        });
    }

    _createVector3Field(field) {
        let getFunction = 'get' + capitalizeFirstLetter(field.parameter);
        return new Vector3Field({
            'title': field.name,
            'initialValue': this._asset[getFunction](),
            'getFromSource': () => this._asset[getFunction](),
            'onBlur': (oldValue, newValue) => {
                this._updateVector3(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateVector3(field.parameter, newValue, false, true);
            },
        });
    }

    _getKeyFromValue(map, value) {
        for(let key in map) {
            if(map[key] == value) return key;
        }
    }

    static FieldTypes = {
        AssetEntityField: AssetEntityField,
        AudioField: AudioField,
        CheckboxField: CheckboxField,
        ColorField: ColorField,
        CubeImageField: CubeImageField,
        EnumField: EnumField,
        EulerField: EulerField,
        ImageField: ImageField,
        MaterialField: MaterialField,
        NumberField: NumberField,
        TextField: TextField,
        TextureField: TextureField,
        Vector2Field: Vector2Field,
        Vector3Field: Vector3Field,
    };
}

EditorHelperFactory.registerEditorHelper(EditorHelper, Asset);
