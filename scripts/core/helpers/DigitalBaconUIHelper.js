import { Styles } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import { Div, Image, Select, Text, TextInput } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import * as THREE from 'three';

export const addHoveredButtonCallback = (button) => {
    button.pointerInteractable.addHoveredCallback((hovered) => {
        if(hovered) {
            button.addStyle(Styles.hoveredButton);
        } else {
            button.removeStyle(Styles.hoveredButton);
        }
    });
}

export const createSmallButton = (label, textureScale = 1) => {
    let button = new Div(Styles.smallButton);
    button.pointerInteractable = new PointerInteractable(button);
    addHoveredButtonCallback(button);
    if(label instanceof THREE.Texture) {
        let scale = Math.floor(textureScale * 100) + '%';
        button.add(new Image(label, { height: scale, width: scale }));
    } else if(typeof label == 'string') {
        button.add(new Text(label, Styles.headerText));
    }
    return button;
};

export const createWideButton = (label = ' ') => {
    let button = new Div(Styles.wideButton);
    button.pointerInteractable = new PointerInteractable(button);
    addHoveredButtonCallback(button);
    let buttonText = new Text(label, Styles.bodyText);
    button.add(buttonText);
    button.textComponent = buttonText;
    return button;
};

export const createWideImageButton = (label = ' ', texture) => {
    let button = new Image(texture, Styles.wideImageButton);
    button.pointerInteractable = new PointerInteractable(button);
    addHoveredButtonCallback(button);
    let buttonText = new Text(label, Styles.bodyText);
    button.add(buttonText);
    button.textComponent = buttonText;
    return button;
};

export const createTextInput = (style) => {
    let textInput = new TextInput(style);
    let oldInteractable = textInput.pointerInteractable;
    textInput.pointerInteractable = new PointerInteractable(textInput);
    oldInteractable.copyEventListenersTo(textInput.pointerInteractable);
    textInput.pointerInteractable.hoveredCursor = 'text';
    return textInput;
};

export const configureOrbitDisabling = (component) => {
    let oldInteractable = component.pointerInteractable;
    component.pointerInteractable = new PointerInteractable(component);
    oldInteractable.copyEventListenersTo(component.pointerInteractable);
    component.pointerInteractable._stateCallbacks
        = oldInteractable._stateCallbacks;
    component.pointerInteractable._hoveredCallbacks
        = oldInteractable._hoveredCallbacks;
    for(let child of oldInteractable.children) {
        component.pointerInteractable.addChild(child);
    }
    if(oldInteractable.parent) {
        oldInteractable.parent.addChild(component.pointerInteractable);
        oldInteractable.parent.removeChild(oldInteractable);
    }
    if(component instanceof Select) {
        for(let span of component._optionsDiv._content.children) {
            configureOrbitDisabling(span);
        }
    }
    return component;
};
