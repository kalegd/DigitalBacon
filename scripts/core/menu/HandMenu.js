/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Scene from '/scripts/core/assets/Scene.js';
import { Colors, vector3s } from '/scripts/core/helpers/constants.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import { Body, Div, Span, Style, Text, GripInteractable } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import * as THREE from 'three';

const BODY_STYLE = new Style({
    borderRadius: 0.01,
    borderWidth: 0.001,
    height: 0.13,
    justifyContent: 'spaceAround',
    materialColor: Colors.defaultMenuBackground,
    opacity: 0.7,
    width: 0.1,
});
const BUTTON_STYLE = new Style({
    borderRadius: 0.005,
    borderWidth: 0.0005,
    height: 0.018,
    opacity: 0,
    width: 0.085,
});
const TEXT_STYLE = new Style({ color: Colors.white, fontSize: 0.01 });

//Creating arrow texture
let resolution = 256;
let unit = resolution / 16;
let canvas = document.createElement('canvas');
canvas.width = resolution;
canvas.height = resolution;
let ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, resolution, resolution);
ctx.fillStyle = '#19b932';
function drawArrow(ctx) {
    ctx.fillRect(resolution / 2 - 0.75 * unit, resolution / 2 - 3.5 * unit, 1.5 * unit, 1.5 * unit);
    ctx.beginPath();
    ctx.moveTo(unit * 8, unit * 2.75);
    ctx.lineTo(unit * 9.75, unit * 4.75);
    ctx.lineTo(unit * 6.25, unit * 4.75);
    ctx.fill();
}

for(let i = 0; i < 4; i++) {
    ctx.translate(resolution / 2, resolution / 2);
    ctx.rotate(i * Math.PI / 2);
    ctx.translate(resolution / -2, resolution / -2);
    drawArrow(ctx);
}
ctx.fillRect(0, 0, resolution, 8);
ctx.fillRect(0, resolution - 8, resolution, 8);

class HandMenu extends Body {
    constructor() {
        super(BODY_STYLE);
        this._open = false;
        this._createWalkingTool();
        this._addButtons();
        this._walkingDirection = new THREE.Vector3();
        this.onClick = () => {};
    }

    _addButtons() {
        this.flyingUp = false;
        this.flyingDown = false;
        this.snapLeft = false;
        this.snapRight = false;

        this._createMenuButton();
        this._createWalkingToolButton();
        this._createFlyingButtons();
        this._createSnapRotationButtons();
    }

    _createMenuButton() {
        let button = createWideButton('Menu');
        button.addStyle(BUTTON_STYLE);
        button.textComponent.addStyle(TEXT_STYLE);
        button.onClick = () => global.menuController._openMenu();
        button.onTouch = (message) => {
            if(message.owner.object == this.parent) return;
            global.menuController._openMenu();
        };
        this.add(button);
    }

    _createWalkingToolButton() {
        let button = createWideButton('Walking Tool');
        button.addStyle(BUTTON_STYLE);
        button.textComponent.addStyle(TEXT_STYLE);
        button.onClick = () => {
            this.walkingTool.position.set(0, 0, 0.05);
            this.localToWorld(this.walkingTool.position);
            this.walkingTool.rotation.set(0, 0, 0);
            Scene.object.add(this.walkingTool);
            Scene.gripInteractable.addChild(this.walkingTool.gripInteractable);
        };
        button.onTouch = (message) => {
            if(message.owner.object == this.parent) return;
            this.walkingTool.position.set(0, 0, 0.05);
            this.localToWorld(this.walkingTool.position);
            this.walkingTool.rotation.set(0, 0, 0);
            Scene.object.add(this.walkingTool);
            Scene.gripInteractable.addChild(this.walkingTool.gripInteractable);
        };
        this.add(button);
    }

    _createFlyingButtons() {
        let span = new Span({
            height: 0.018,
            justifyContent: 'spaceBetween',
            width: 0.085,
        });
        let flyingButtons = [];
        for(let direction of ['down', 'up']) {
            let button = createWideButton(direction == 'down' ? '<' : '>');
            let param = 'flying' + direction.substring(0, 1).toUpperCase()
                + direction.substring(1);
            button.addStyle(BUTTON_STYLE);
            button.addStyle(new Style({ width: 0.018 }));
            button.rotation.z = Math.PI / 2;
            button.textComponent.addStyle(TEXT_STYLE);
            button.pointerInteractable.addEventListener('down', (message) => {
                this[param] = true;
                button.pointerInteractable.capture(message.owner);
            });
            button.pointerInteractable.addEventListener('up', () => {
                this[param] = false;
            });
            button.touchInteractable.addEventListener('down', (message) => {
                if(message.owner.object == this.parent) return;
                this[param] = true;
            });
            button.touchInteractable.addEventListener('up', (message) => {
                if(message.owner.object == this.parent) return;
                this[param] = false;
            });
            flyingButtons.push(button);
        }
        span.add(flyingButtons[0]);
        let text = new Text('Fly', TEXT_STYLE);
        span.add(text);
        span.add(flyingButtons[1]);
        this.add(span);
    }

    _createSnapRotationButtons() {
        let span = new Span({
            height: 0.018,
            justifyContent: 'spaceBetween',
            width: 0.085,
        });
        let snapButtons = [];
        for(let direction of ['left', 'right']) {
            let button = createWideButton(direction == 'left' ? '<' : '>');
            let param = 'snap' + direction.substring(0, 1).toUpperCase()
                + direction.substring(1);
            button.addStyle(BUTTON_STYLE);
            button.addStyle(new Style({ width: 0.018 }));
            button.textComponent.addStyle(TEXT_STYLE);
            button.pointerInteractable.addEventListener('down', (message) => {
                this[param] = true;
                button.pointerInteractable.capture(message.owner);
            });
            button.pointerInteractable.addEventListener('up', () => {
                this[param] = false;
            });
            button.touchInteractable.addEventListener('down', (message) => {
                if(message.owner.object == this.parent) return;
                this[param] = true;
            });
            button.touchInteractable.addEventListener('up', (message) => {
                if(message.owner.object == this.parent) return;
                this[param] = false;
            });
            snapButtons.push(button);
        }
        span.add(snapButtons[0]);
        let text = new Text('Rotate', TEXT_STYLE);
        span.add(text);
        span.add(snapButtons[1]);
        this.add(span);
    }

    _createWalkingTool() {
        let texture = new THREE.CanvasTexture(canvas);
        texture.repeat.set(4, 2);
        texture.offset.set(0.5, -0.5);
        texture.wrapS = THREE.RepeatWrapping;
        let geometry = new THREE.SphereGeometry(0.05);
        let material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
        });
        this.walkingTool = new THREE.Mesh(geometry, material);
        this.walkingTool.renderOrder = Infinity;
        this.walkingToolLabel = new Text('Grab and Point', TEXT_STYLE);
        this.walkingToolLabel.position.y = 0.07;
        this.walkingTool.add(this.walkingToolLabel);
        let gripInteractable = new GripInteractable(this.walkingTool);
        gripInteractable.addEventListener('down', (message) => {
            if(this.walkingTool.owner) return;
            gripInteractable.capture(message.owner);
            this.walkingTool.owner = message.owner;
            this.walkingToolLabel.visible = false;
            message.owner.object.attach(this.walkingTool);
            material.opacity = 0.5;
        });
        gripInteractable.addEventListener('up', (message) => {
            if(this.walkingTool.owner != message.owner) return;
            Scene.object.attach(this.walkingTool);
            this.walkingTool.owner = null;
            this.walkingToolLabel.visible = true;
            material.opacity = 1;
        });
    }

    calculateWalkingDirection() {
        let bones = this.walkingTool.owner.object?.asset?._modelObject
            ?.motionController?.bones;
        if(!bones) return;
        bones[8].getWorldPosition(vector3s[0]);
        bones[9].getWorldPosition(this._walkingDirection);
        this._walkingDirection.sub(vector3s[0]);
        this._walkingDirection.normalize();
        return this._walkingDirection;
    }

    removeWalkingTool() {
        if(this.walkingTool.parent)
            this.walkingTool.parent.remove(this.walkingTool);
        Scene.gripInteractable.removeChild(this.walkingTool.gripInteractable);
    }

    update(timeDelta) {
        if(!this._opening) return;
        this._scale += timeDelta * 3;
        if(this._scale > 1) {
            this._scale = 1;
            this._opening = false;
        }
        this.scale.setScalar(this._scale);
    }

    get open() { return this._open; }
    set open(open) {
        if(this._open == open) return;
        if(open) {
            this._opening = true;
            this._scale = 0.01;
            this.scale.setScalar(this._scale);
        } else {
            this.flyingUp = false;
            this.flyingDown = false;
            this.snapLeft = false;
            this.snapRight = false;
        }
        this._open = open;
    }
}

export default HandMenu;
