/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4, intersectRelevantObjects } from '/scripts/core/helpers/utils.module.js';
import { PointerInteractableHandler, InteractionToolHandler } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class PlaceHandler {
    constructor() {
        this._id = uuidv4();
        this._controllerAlreadyPressed = {};
        this._grabbedAssets = {};
        PointerInteractableHandler.registerToolHandler(InteractionTools.PLACE,
            (controller) => this._toolHandler(controller));
        InteractionToolHandler.addUpdateListener(() => {
            if(Object.keys(this._grabbedAssets).length > 0) this._clear();
            this._controllerAlreadyPressed = {};
        });
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, () => {
            if(Object.keys(this._grabbedAssets).length > 0) this._clear();
            this._controllerAlreadyPressed = {};
        });
    }

    grab(ownerId, asset) {
        if(this._grabbedAssets[ownerId]) this._resetAsset(ownerId);
        for(let otherOwnerId in this._grabbedAssets) {
            if(this._grabbedAssets[otherOwnerId].asset == asset)
                this._resetAsset(otherOwnerId);
        }
        let grabbedAsset = {
            asset: asset,
            ownerId: ownerId,
            preState: asset.editorHelper.getObjectTransformation(),
        };
        this._grabbedAssets[ownerId] = grabbedAsset
        this._controllerAlreadyPressed[ownerId] = true;
        asset.editorHelper._disableParam('position');
        asset.editorHelper._disableParam('rotation');
        asset.editorHelper._disableParam('scale');
    }

    _checkPlacement(controller, place) {
        let ownerId = controller.owner.id;
        let grabbedAsset = this._grabbedAssets[ownerId];
        let asset = grabbedAsset.asset;
        let editorHelper = asset.editorHelper;
        let raycaster = controller['raycaster'];
        raycaster.firstHitOnly = true;
        raycaster.far = Infinity;
        let intersections = intersectRelevantObjects(raycaster,
            ProjectHandler.getObjects(), asset.object);
        if(intersections.length > 0) {
            controller['closestPoint'] = intersections[0].point;
            editorHelper.place(intersections[0]);
            let postState = editorHelper.getObjectTransformation();
            if(place) {
                editorHelper.roundAttributes(true);
                editorHelper.setObjectTransformation(grabbedAsset.preState,
                    postState, false, false, true);
                editorHelper._enableParam('position');
                editorHelper._enableParam('rotation');
                editorHelper._enableParam('scale');
                delete this._grabbedAssets[ownerId];
            } else {
                editorHelper.setObjectTransformation(grabbedAsset.preState,
                    postState, false, true, true);
            }
        } else {
            editorHelper._updateParameter('position',
                grabbedAsset.preState.position, false, true, null, true);
            editorHelper._updateParameter('rotation',
                grabbedAsset.preState.rotation, false, true, null, true);
        }
    }

    _toolHandler(controller) {
        let ownerId = controller.owner.id;
        if(!this._grabbedAssets[ownerId]) return false;
        let place = false;
        if(controller.isPressed != this._controllerAlreadyPressed[ownerId]) {
            this._controllerAlreadyPressed[ownerId] = controller.isPressed;
            if(controller.isPressed) place = true;
        }
        this._checkPlacement(controller, place);
        return true;
    }

    _resetAsset(ownerId) {
        let grabbedAsset = this._grabbedAssets[ownerId];
        grabbedAsset.asset.position = grabbedAsset.preState.position;
        grabbedAsset.asset.rotation = grabbedAsset.preState.rotation;
        grabbedAsset.asset.editorHelper._publish(['position', 'rotation']);
        delete this._grabbedAssets[ownerId];
    }

    _clear() {
        for(let ownerId in this._grabbedAssets) {
            this._resetAsset(ownerId);
        }
        this._grabbedAssets = {};
    }
}

let placeHandler = new PlaceHandler();
export default placeHandler;
