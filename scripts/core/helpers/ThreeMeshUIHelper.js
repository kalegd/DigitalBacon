/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/core/enums/InteractableStates.js';
import { Colors, FontSizes, Textures } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

const defaultOffset = 0.008;
const defaultMargin = 0.01;
const defaultWidth = 0.01;
const defaultHeight = 0.01;

export default class ThreeMeshUIHelper {
    static createTextBlock(params) {
        let text = (params['text']) ? params['text'] : "";
        let fontSize = (params['fontSize'])
            ? params['fontSize']
            : FontSizes.body;
        let fontColor = (params['fontColor'])
            ? params['fontColor']
            : Colors.white;
        let backgroundColor = (params['backgroundColor'])
            ? params['backgroundColor']
            : null;
        let backgroundOpacity = (params['backgroundOpacity'])
            ? params['backgroundOpacity']
            : 0;
        let justifyContent = params['justifyContent'] || 'center';
        let textAlign = params['textAlign'] || 'center';
        let height = (params['height']) ? params['height'] : 0.05;
        let width = (params['width']) ? params['width'] : 0.7;
        let margin = numberOr(params['margin'], defaultMargin);
        let textBlock = new ThreeMeshUI.Block({
            height: height,
            width: width,
            margin: margin,
            offset: 0,
            justifyContent: justifyContent,
            textAlign: textAlign,
            backgroundColor: backgroundColor,
            backgroundOpacity: backgroundOpacity,
            interLine: 0,
        });
        let textComponent = new ThreeMeshUI.Text({
            content: text,
            fontColor: fontColor,
            fontSize: fontSize,
            offset: 0,
        });
        if(params['fontFamily'] && params['fontTexture']) {
            textComponent.set({
                fontFamily: params['fontFamily'],
                fontTexture: params['fontTexture'],
            });
        }
        textBlock.add(textComponent);
        return textBlock;
    }

    static createButtonBlock(params) {
        let text = params['text'];
        let backgroundTexture = params['backgroundTexture'];
        let backgroundTextureScale = (params['backgroundTextureScale'])
            ? params['backgroundTextureScale']
            : 1;
        let borderRadius = (params['borderRadius'])
            ? params['borderRadius']
            : 0.01;
        let fontSize = (params['fontSize'])
            ? params['fontSize']
            : FontSizes.body;
        let fontColor = (params['fontColor'])
            ? params['fontColor']
            : Colors.white;
        let idleBackgroundColor = params['idleBackgroundColor']
            || Colors.defaultIdle;
        let hoveredBackgroundColor = params['hoveredBackgroundColor']
            || Colors.defaultHovered;
        let selectedBackgroundColor = params['selectedBackgroundColor']
            || Colors.defaultHovered;
        let idleOpacity = numberOr(params['idleOpacity'], 0.7);
        let hoveredOpacity = numberOr(params['hoveredOpacity'], 0.8);
        let selectedOpacity = numberOr(params['selectedOpacity'], 0.8);
        let height = (params['height']) ? params['height'] : 0.15;
        let width = (params['width']) ? params['width'] : 0.7;
        let margin = numberOr(params['margin'], defaultMargin);
        let buttonBlock = new ThreeMeshUI.Block({
            height: height,
            width: width,
            justifyContent: 'center',
            alignItems: 'center',
            margin: margin,
            borderWidth: 0,
            borderRadius: borderRadius,
            interLine: 0,
        });
        if(backgroundTexture) {
            let imageBlock = new ThreeMeshUI.Block({
                height: height * backgroundTextureScale,
                width: width * backgroundTextureScale,
                backgroundTexture: backgroundTexture,
                offset: 0.0001,
                borderRadius: 0,
            });
            buttonBlock.add(imageBlock);
        }
        if(text) {
            let buttonText = new ThreeMeshUI.Text({
                content: text,
                fontColor: fontColor,
                fontSize: fontSize,
                offset: 0,
            });
            if(params['fontFamily'] && params['fontTexture']) {
                buttonText.set({
                    fontFamily: params['fontFamily'],
                    fontTexture: params['fontTexture'],
                });
            }
            buttonBlock.add(buttonText);
        }
        buttonBlock.setupState({
            state: States.IDLE,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: idleOpacity,
                backgroundColor: idleBackgroundColor,
            },
            //onSet: ()=> {
            //    console.log("Button now idle!");
            //}
        });
        buttonBlock.setupState({
            state: States.HOVERED,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: hoveredOpacity,
                backgroundColor: hoveredBackgroundColor,
            },
            //onSet: ()=> {
            //    console.log("Button now hovered over!");
            //}
        });
        buttonBlock.setupState({
            state: States.SELECTED,
            attributes: {
                offset: defaultOffset / 2,
                backgroundOpacity: selectedOpacity,
                backgroundColor: selectedBackgroundColor,
            },
            //onSet: ()=> {
            //    console.log("Selected button!");
            //}
        });
        buttonBlock.setState(States.IDLE);
        return buttonBlock;
    }

    static createInputBlock(params) {
        let text = params['text'] || " ";
        let backgroundTexture = params['backgroundTexture'];
        let fontSize = (params['fontSize'])
            ? params['fontSize']
            : FontSizes.body;
        let fontColor = (params['fontColor'])
            ? params['fontColor']
            : Colors.white;
        let idleBackgroundColor = params['idleBackgroundColor']
            || Colors.defaultIdle;
        let hoveredBackgroundColor = params['hoveredBackgroundColor']
            || Colors.defaultHovered;
        let selectedBackgroundColor = params['selectedBackgroundColor']
            || Colors.defaultHovered;
        let idleOpacity = numberOr(params['idleOpacity'], 0.7);
        let hoveredOpacity = numberOr(params['hoveredOpacity'], 0.8);
        let selectedOpacity = numberOr(params['selectedOpacity'], 0.8);
        let height = (params['height']) ? params['height'] : 0.15;
        let width = (params['width']) ? params['width'] : 0.7;
        let margin = numberOr(params['margin'], defaultMargin);
        let buttonBlock = new ThreeMeshUI.Block({
            height: height,
            width: width,
            justifyContent: 'center',
            alignItems: 'center',
            margin: margin,
            borderWidth: 0.001,
            interLine: 0,
        });
        let buttonText = new ThreeMeshUI.Text({
            content: text,
            fontColor: fontColor,
            fontSize: fontSize,
            offset: 0,
        });
        buttonBlock.add(buttonText);
        buttonBlock.setupState({
            state: States.IDLE,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: idleOpacity,
                backgroundColor: idleBackgroundColor,
            },
        });
        buttonBlock.setupState({
            state: States.HOVERED,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: hoveredOpacity,
                backgroundColor: hoveredBackgroundColor,
            },
        });
        buttonBlock.setupState({
            state: States.SELECTED,
            attributes: {
                offset: defaultOffset / 2,
                backgroundOpacity: selectedOpacity,
                backgroundColor: selectedBackgroundColor,
            },
        });
        buttonBlock.setState(States.IDLE);
        return buttonBlock;
    }

    static createCheckboxBlock(params) {
        let selectedColor = (params['selectedColor'])
            ? params['selectedColor']
            : Colors.black;
        let height = (params['height']) ? params['height'] : 0.15;
        let width = (params['width']) ? params['width'] : 0.7;
        let initialValue = params['initialValue'] || 0;
        let margin = numberOr(params['margin'], defaultMargin);
        let buttonBlock = new ThreeMeshUI.Block({
            height: height,
            width: width,
            justifyContent: 'center',
            alignItems: 'center',
            margin: margin,
            offset: defaultOffset / 2,
            borderWidth: 0,
            backgroundColor: Colors.white,
        });
        let colorBlock = new ThreeMeshUI.Block({
            height: height * 0.9,
            width: width * 0.9,
            backgroundColor: selectedColor,
            backgroundOpacity: 0.8 * initialValue,
            backgroundTexture: Textures.checkmarkIcon,
            offset: 0.001,
        });
        buttonBlock.add(colorBlock);
        buttonBlock.setupState({
            state: States.IDLE,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: 0.7,
            },
        });
        buttonBlock.setupState({
            state: States.HOVERED,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: 0.8,
            },
        });
        buttonBlock.setupState({
            state: States.SELECTED,
            attributes: {
                offset: defaultOffset / 2,
                backgroundOpacity: 0.8,
            },
        });
        buttonBlock.setState(States.IDLE);
        buttonBlock.toggle = () => {
            if(colorBlock.backgroundOpacity == 0.8) {
                colorBlock.set({ backgroundOpacity: 0 });
                return 0;
            } else {
                colorBlock.set({ backgroundOpacity: 0.8 });
                return 1;
            }
        };
        buttonBlock.getIsChecked = () => {
            return colorBlock.backgroundOpacity == 0.8;
        }
        return buttonBlock;
    }

    static createColorBlock(params) {
        let selectedColor = (params['selectedColor'])
            ? params['selectedColor']
            : Colors.yellow;
        let height = (params['height']) ? params['height'] : 0.15;
        let width = (params['width']) ? params['width'] : 0.7;
        let margin = numberOr(params['margin'], defaultMargin);
        let buttonBlock = new ThreeMeshUI.Block({
            height: height,
            width: width,
            margin: margin,
            backgroundColor: selectedColor,
            backgroundOpacity: 1,
            offset: defaultOffset,
            borderWidth: 0.001,
        });
        buttonBlock.setupState({
            state: States.IDLE,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: 0.7,
            },
        });
        buttonBlock.setupState({
            state: States.HOVERED,
            attributes: {
                offset: defaultOffset,
                backgroundOpacity: 0.8,
            },
        });
        buttonBlock.setupState({
            state: States.SELECTED,
            attributes: {
                offset: defaultOffset / 2,
                backgroundOpacity: 0.8,
            },
        });
        buttonBlock.setState(States.IDLE);
        return buttonBlock;
    }
}
