/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    radiansToDegrees,
    cartesianToPolar,
    polarToCartesian,
    hslToRGB,
    rgbToHex } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const LIGHTNESS_WIDTH = 1;
const LIGHTNESS_HEIGHT = 256;
const RADIUS = 128;
const R_SQUARED = RADIUS * RADIUS;
const INNER_RADIUS = 8;
const OUTER_RADIUS = 16;
const OR_SQUARED = OUTER_RADIUS * OUTER_RADIUS;
const PIXEL_BYTES = 4;

class ColorWheel {
    constructor() {
        this._hue = 171;
        this._saturation = 0.7;
        this._lightness = 0.5;
        this._createTextures();
    }

    _createTextures() {
        let colorCanvas = document.createElement('canvas');
        let lightnessCanvas = document.createElement('canvas');
        colorCanvas.width = RADIUS * 2;
        colorCanvas.height = RADIUS * 2;
        lightnessCanvas.width = LIGHTNESS_WIDTH;
        lightnessCanvas.height = LIGHTNESS_HEIGHT;
        this._colorContext = colorCanvas.getContext("2d");
        this._lightnessContext = lightnessCanvas.getContext("2d");
        this._updateColorWheel();
        this._updateLightnessBar();
        this._colorTexture = new THREE.CanvasTexture(colorCanvas);
        this._lightnessTexture = new THREE.CanvasTexture(lightnessCanvas);
    }

    _updateColorWheel() {
        let image = this._colorContext.getImageData(0, 0, 2 * RADIUS, 2 * RADIUS);
        let data = image.data;
        this._drawColorWheel(data);
        //this._drawSelectCircle(data);

        this._colorContext.putImageData(image, 0, 0);
    }

    _drawColorWheel(data) {
        let lightness = this._lightness;
        for(let x = -RADIUS; x <= RADIUS; x++) {
            let xSquared = x * x;
            let yMax = Math.ceil(Math.sqrt(R_SQUARED - xSquared));
            for(let y = -yMax; y <= yMax; y++) {
                let [r, phi] = cartesianToPolar(x, y);
                if(r > RADIUS) continue;

                // Need to convert coordinates from [-RADIUS,RADIUS] to
                // [0,RADIUS] for getting index of Image Data Array
                let rowLength = 2 * RADIUS;
                let adjustedX = x + RADIUS;
                let adjustedY = y + RADIUS;
                let index = (adjustedX + (adjustedY * rowLength)) * PIXEL_BYTES;

                let hue = radiansToDegrees(phi);
                let saturation = r / RADIUS;
                let [red, green, blue] = hslToRGB(hue, saturation, lightness);
                data[index] = red;
                data[index+1] = green;
                data[index+2] = blue;
                data[index+3] = 255;
            }
        }
    }

    //_drawSelectCircle(data) {
    //    let [xCenter, yCenter] = polarToCartesian(this._saturation * RADIUS,
    //        THREE.MathUtils.degToRad(this._hue + 180));
    //    xCenter = Math.round(xCenter);
    //    yCenter = Math.round(yCenter);
    //    for(let x = xCenter - OUTER_RADIUS; x < xCenter + OUTER_RADIUS; x++) {
    //        let xSquared = (x - xCenter) ** 2;
    //        let yMax = Math.ceil(Math.sqrt(OR_SQUARED - xSquared));
    //        for(let y = yCenter - yMax; y <= yCenter + yMax; y++) {
    //            let [r, phi] = cartesianToPolar(x, y);
    //            if(r > RADIUS) continue;

    //            let distanceFromSelection = Math.sqrt((xCenter - x) ** 2
    //                + (yCenter - y) ** 2);
    //            if(distanceFromSelection < INNER_RADIUS
    //                || distanceFromSelection > OUTER_RADIUS)
    //                continue;

    //            // Need to convert coordinates from [-RADIUS,RADIUS] to
    //            // [0,RADIUS] for getting index of Image Data Array
    //            let rowLength = 2 * RADIUS;
    //            let adjustedX = x + RADIUS;
    //            let adjustedY = y + RADIUS;
    //            let index = (adjustedX + (adjustedY * rowLength)) * PIXEL_BYTES;

    //            data[index] = 255;
    //            data[index+1] = 255;
    //            data[index+2] = 255;
    //            data[index+3] = 255;
    //        }
    //    }
    //}

    _updateLightnessBar() {
        let image = this._lightnessContext.getImageData(0, 0, LIGHTNESS_WIDTH, LIGHTNESS_HEIGHT);
        let data = image.data;
        for(let x = 0; x < LIGHTNESS_WIDTH; x++) {
            for(let y = 0; y < LIGHTNESS_HEIGHT; y++) {
                let index = (x + (y * LIGHTNESS_WIDTH)) * PIXEL_BYTES;

                let hue = this._hue;
                let saturation = this._saturation;
                let lightness = 1 - y / LIGHTNESS_HEIGHT;
                let [red, green, blue] = hslToRGB(hue, saturation, lightness);

                data[index] = red;
                data[index+1] = green;
                data[index+2] = blue;
                data[index+3] = 255;
            }
        }

        this._lightnessContext.putImageData(image, 0, 0);
    }

    getColorTexture() {
        return this._colorTexture;
    }

    getLightnessTexture() {
        return this._lightnessTexture;
    }

    getXY(radius) {
        return polarToCartesian(this._saturation * radius,
            THREE.MathUtils.degToRad(this._hue + 180));
    }

    getLightness() {
        return this._lightness;
    }

    setFromHSL(hsl) {
        this._hue = hsl.h * 360;
        this._saturation = hsl.s;
        this._lightness = hsl.l;
        this._updateColorWheel();
        this._updateLightnessBar();
        this._colorTexture.needsUpdate = true;
        this._lightnessTexture.needsUpdate = true;
    }

    selectColorFromXY(radius, x, y) {
        let [r, phi] = cartesianToPolar(x, y);
        if(r > radius) r = radius;

        let hue = radiansToDegrees(-phi);
        let saturation = r / radius;
        let lightness = this._lightness;
        let [red, green, blue] = hslToRGB(hue, saturation, lightness);
        this._hue = hue;
        this._saturation = saturation;
        //this._updateColorWheel();
        this._updateLightnessBar();
        //this._colorTexture.needsUpdate = true;
        this._lightnessTexture.needsUpdate = true;
        return rgbToHex(red, green, blue);
    }

    selectLightnessFromXY(height, x, y) {
        let hue = this._hue;
        let saturation = this._saturation;
        let lightness = y / height + 0.5;
        if(lightness < 0) lightness = 0;
        if(lightness > 1) lightness = 1;
        let [red, green, blue] = hslToRGB(hue, saturation, lightness);
        this._lightness = lightness;
        this._updateColorWheel();
        this._colorTexture.needsUpdate = true;
        return rgbToHex(red, green, blue);
    }
}

let colorWheel = new ColorWheel();
export default colorWheel;
