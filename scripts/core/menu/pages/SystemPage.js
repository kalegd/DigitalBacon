/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SystemsHandler from '/scripts/core/handlers/SystemsHandler.js';
import { FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import TextField from '/scripts/core/menu/input/TextField.js';
import DynamicFieldsPage from '/scripts/core/menu/pages/DynamicFieldsPage.js';
import ThreeMeshUI from 'three-mesh-ui';

class SystemPage extends DynamicFieldsPage {
    constructor(controller) {
        super(controller, true);
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
                this._system.editorHelper.updateName(this._titleField.content);
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
            SystemsHandler.deleteSystem(this._system);
        });
        this._containerInteractable.addChild(interactable);
    }

    setSystem(system) {
        this._system = system;
        let name = system.getName();
        this._titleField.setContent(name);
        this._setFields(system.editorHelper.getMenuFields());
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.SYSTEM_DELETED, (e) => {
            if(e.system == this._system) {
                this._controller.popPagesPast(MenuPages.SYSTEM);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.SYSTEM_UPDATED, (message) =>{
            if(message.asset == this._system) {
                this._titleField.setContent(message.asset.getName());
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            if(!done) return;
            this._removeSubscriptions();
            this._containerInteractable.removeChild(this._previousInteractable);
            this._containerInteractable.removeChild(this._nextInteractable);
            this._controller.setPage(MenuPages.NAVIGATION);
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.SYSTEM_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.SYSTEM_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.PROJECT_LOADING);
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

export default SystemPage;
