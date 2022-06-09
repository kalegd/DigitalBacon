/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class InstancePage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller, false, true);
    }

    _createTitleBlock() {
        this._titleBlock = new ThreeMeshUI.Block({
            'height': 0.04,
            'width': 0.43,
            'contentDirection': 'row',
            'justifyContent': 'end',
            'backgroundOpacity': 0,
            'margin': 0.01,
            'offset': 0,
        });
        this._titleField = new TextField({
            'height': 0.04,
            'width': 0.31,
            'fontSize': FontSizes.header,
            'margin': 0,
            'onBlur': () => {
                this._instance.setName(this._titleField.content);
            },
        });
        let deleteButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.trashIcon,
            'backgroundTextureScale': 0.7,
            'height': 0.04,
            'width': 0.04,
        });
        this._titleBlock.add(this._titleField.getObject());
        this._titleBlock.add(deleteButton);
        this._titleField.setPointerInteractableParent(
            this._containerInteractable);
        let interactable = new PointerInteractable(deleteButton, () => {
            ProjectHandler.deleteAssetInstance(this._instance);
        });
        this._containerInteractable.addChild(interactable);
    }

    setInstance(instance) {
        this._instance = instance;
        let name = instance.getName();
        this._titleField.setContent(name);
        this._setFields(instance.getMenuFields());
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DELETED, (e) => {
            if(e.instance == this._instance) {
                this._controller.popPagesPast(MenuPages.INSTANCE);
            }
        });
        //PubSub.subscribe(this._id, PubSubTopics.INSTANCE_UPDATED, (instance)=> {
        //    if(instance == this._instance) {
        //        for(let field of this._fields) {
        //            field.updateFromSource();
        //        }
        //        this._titleField.setContent(instance.getName());
        //    }
        //});
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ATTACHED, (params) => {
            let id = params.instance.getId();
            if(id == this._instance.getId()) {
                this._unfocusFields();
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_DELETED);
        //PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ATTACHED);
    }

    back() {
        this._removeCurrentFields();
        this._containerInteractable.removeChild(this._previousInteractable);
        this._containerInteractable.removeChild(this._nextInteractable);
        this._removeSubscriptions();
        super.back();
    }

    addToScene(scene, parentInteractable) {
        this._addSubscriptions();
        super.addToScene(scene, parentInteractable);
    }

    removeFromScene() {
        super.removeFromScene();
    }

}

export default InstancePage;
