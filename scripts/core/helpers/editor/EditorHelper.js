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
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import AssetField from '/scripts/core/menu/input/AssetField.js';
import AssetSetField from '/scripts/core/menu/input/AssetSetField.js';
import AudioField from '/scripts/core/menu/input/AudioField.js';
import ButtonField from '/scripts/core/menu/input/ButtonField.js';
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
    AssetField: "_createAssetField",
    AssetSetField: "_createAssetSetField",
    AudioField: "_createAudioField",
    ButtonField: "_createButtonField",
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
        this._id = asset.id;
        this._updatedTopic = updatedTopic + ':' + asset.assetId + ':'
            + this._id;
        this._deletedAssetSetValues = new Set();
        this._deletedAttachedComponents = new Set();
        this._disabledParams = new Set();
        this._addComponentSubscriptions();
    }

    _publish(params, extraData) {
        let message = { asset: this._asset, fields: params,extraData:extraData};
        PubSub.publish(this._id, this._updatedTopic, message);
    }

    _updateParameter(param, newValue, ignorePublish, ignoreUndoRedo, oldValue,
                     ignoreDisabledCheck) {
        let currentValue = this._asset[param];
        if(!this._disabledParams.has(param) || ignoreDisabledCheck) {
            if(!this._parameterValuesEqual(currentValue, newValue)) {
                this._asset[param] = newValue;
                if(!ignorePublish)
                    this._publish([param]);
            }
        }
        if(oldValue == null) oldValue = currentValue;
        if(!ignoreUndoRedo && !this._parameterValuesEqual(oldValue, newValue)) {
            UndoRedoHandler.addAction(() => {
                this._updateParameter(param, oldValue, ignorePublish, true);
                this.updateMenuField(param);
            }, () => {
                this._updateParameter(param, newValue, ignorePublish, true);
                this.updateMenuField(param);
            });
        }
    }

    _parameterValuesEqual(value1, value2) {
        if(Array.isArray(value1) && Array.isArray(value2)) {
            return value1.reduce((a, v, i) => a && value2[i] == v, true);
        } else {
            return value1 == value2;
        }
    }

    _addToParameter(param, funcName, removeFuncName, value, ignorePublish,
            ignoreUndoRedo) {
        let asset = ProjectHandler.getAsset(value);
        if(asset) {
            this._asset[funcName](value);
            this.updateMenuField(param);
        } else {
            asset = ProjectHandler.getSessionAsset(value);
            if(!asset) return;
            this._subscribeToAssetAdded(asset, param, funcName, value);
        }
        if(!ignorePublish) {
            this._publish([param], {
                [param]: { type: 'useFunction', funcName: funcName,value:value},
            });
        }
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._removeFromParameter(param, removeFuncName, funcName,value,
                    ignorePublish, true);
            }, () => {
                this._addToParameter(param, funcName, removeFuncName, value,
                    ignorePublish, true);
            });
        }
    }

    _removeFromParameter(param, funcName, addFuncName, value, ignorePublish, ignoreUndoRedo){
        let asset = ProjectHandler.getAsset(value);
        if(asset) {
            this._asset[funcName](value);
            this.updateMenuField(param);
        } else {
            asset = ProjectHandler.getSessionAsset(value);
            if(!asset) return;
        }
        this._unsubscribeFromAssetAdded(asset);
        if(!ignorePublish) {
            this._publish([param], {
                [param]: { type: 'useFunction', funcName: funcName,value:value},
            });
        }
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._addToParameter(param, addFuncName, funcName, value,
                    ignorePublish, true);
            }, () => {
                this._removeFromParameter(param, funcName, addFuncName, value,
                    ignorePublish, true);
            });
        }
    }

    _subscribeToAssetAdded(asset, param, funcName, value) {
        this._deletedAssetSetValues.add(asset);
        let assetType = asset.constructor.assetType;
        let topic = assetType + '_ADDED:' + asset.assetId + ':' + asset.id;
        PubSub.subscribe(this._id, topic, (asset) => {
            if(!this._deletedAssetSetValues.has(asset)) return;
            this._addToParameter(param, funcName, null, value, true, true);
        });
    }

    _unsubscribeFromAssetAdded(asset) {
        if(!this._deletedAssetSetValues.has(asset)) return;
        this._deletedAssetSetValues.delete(asset);
        let topic = assetType + '_ADDED:' + asset.assetId + ':' + asset.id;
        PubSub.unsubscribe(this._id, topic);
    }

    updateMenuField(param) {
        if(!this._menuFields) return;
        let menuField = this._menuFieldsMap[param];
        if(menuField) menuField.updateFromSource();
    }

    updateName(newName, ignoreUndoRedo) {
        let oldName = this._asset.name;
        if(oldName == newName) return;
        this._asset.name = newName;
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
        let componentAssetId = component.assetId;
        let topic = topicPrefix + ':' + componentAssetId;
        PubSub.publish(this._id, topic, {
            id: this._id,
            componentId: component.id,
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

    _disableParam(param) {
        this._disabledParams.add(param);
        if(this._menuFields) this._menuFieldsMap[param].disabled = true;
    }

    _enableParam(param) {
        if(!this._disabledParams.has(param)) return;
        this._disabledParams.delete(param);
        if(this._menuFields) this._menuFieldsMap[param].disabled = false;
    }

    getMenuFields() {
        let thisClass = this.constructor;
        if(!thisClass.fields) return [];
        if(this._menuFields) return this._menuFields;

        this._menuFieldsMap = this._getMenuFieldsMap(thisClass);
        let menuFields = [];
        for(let field of thisClass.fields) {
            let parameter = (typeof field == 'string') ? field :field.parameter;
            if(parameter in this._menuFieldsMap) {
                menuFields.push(this._menuFieldsMap[parameter]);
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
            if(typeof field == 'string') {
                continue;
            } else if(field.parameter in menuFieldsMap) {
                continue;
            } else {
                let input = this._createStandardField(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }

    _createStandardField(field) {
        let type = typeof field.type == 'string'
            ? field.type
            : field.type.name;
        if(type in INPUT_TYPE_TO_CREATE_FUNCTION) {
            return this[INPUT_TYPE_TO_CREATE_FUNCTION[type]](field);
        }
    }

    _createAssetField(field) {
        return new AssetField({
            'title': field.name,
            'exclude': field.includeSelf ? null : this._id,
            'filter': typeof field.filter == 'function' ? field.filter : null,
            'privateIds': field.privateIdsParameter
                ? this._asset[field.privateIdsParameter]
                : null,
            'includeScene': field.includeScene,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createAssetSetField(field) {
        return new AssetSetField({
            'title': field.name,
            'getOptions': field.optionsFunction,
            'getNewOptions': field.newOptionsFunction,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onAdd': (value) => {
                this._addToParameter(field.parameter, field.addFunction,
                    field.removeFunction, value);
            },
            'onRemove': (value, index) => {
                this._removeFromParameter(field.parameter, field.removeFunction,
                    field.addFunction, value);
            },
        });
    }

    _createAudioField(field) {
        return new AudioField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createButtonField(field) {
        return new ButtonField({
            'title': field.name,
            'onClick': () => {
                if(typeof this[field.parameter] == 'function')
                    this[field.parameter]();
            },
        });
    }

    _createCheckboxField(field) {
        return new CheckboxField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'suppressMenuFocusEvent': field.suppressMenuFocusEvent == true,
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createColorField(field) {
        return new ColorField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
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
        return new CubeImageField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createEnumField(field) {
        return new EnumField({
            'title': field.name,
            'initialValue': this._getKeyFromValue(field.map,
                this._asset[field.parameter]),
            'options': Object.keys(field.map),
            'getFromSource': () => this._getKeyFromValue(field.map,
                this._asset[field.parameter]),
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, field.map[newValue]);
            },
        });
    }

    _createEulerField(field) {
        return new EulerField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _createImageField(field) {
        return new ImageField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createMaterialField(field) {
        return new MaterialField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createNumberField(field) {
        return new NumberField({
            'title': field.name,
            'minValue': field.min,
            'maxValue': field.max,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
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
        return new TextField({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'singleLine': field.singleLine,
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (field.onlyUpdateOnBlur) ? null : (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _createTextureField(field) {
        return new TextureField({
            'title': field.name,
            'filter': Array.isArray(field.filter) ? field.filter : null,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue);
            },
        });
    }

    _createVector2Field(field) {
        return new Vector2Field({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _createVector3Field(field) {
        return new Vector3Field({
            'title': field.name,
            'initialValue': this._asset[field.parameter],
            'getFromSource': () => this._asset[field.parameter],
            'onBlur': (oldValue, newValue) => {
                this._updateParameter(field.parameter, newValue, false, false,
                    oldValue);
            },
            'onUpdate': (newValue) => {
                this._updateParameter(field.parameter, newValue, false, true);
            },
        });
    }

    _getKeyFromValue(map, value) {
        for(let key in map) {
            if(map[key] == value) return key;
        }
    }

    static FieldTypes = {
        AssetField: AssetField,
        AssetSetField: AssetSetField,
        AudioField: AudioField,
        ButtonField: ButtonField,
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
