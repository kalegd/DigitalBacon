/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as THREE from 'three';

export const uuidv4 = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
        c => (c^crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
        .toString(16));
};

//https://github.com/domske/uuid-tool/blob/master/src/uuid.ts
export const uuidToBytes = (uuid) => {
    let array = new Uint8Array(16);
    (uuid.replace(/-/g, '').match(/.{2}/g) || [])
        .map((b, i) => array[i] = parseInt(b, 16));
    return array;
}

export const uuidFromBytes = (bytes) => {
    let array = [];
    for(let b of bytes) {
        array.push(('00' + b.toString(16)).slice(-2));
    }
    return array.join('')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

export const numberOr = (number, defaultValue) => {
    return (typeof number == 'number')
        ? number
        : defaultValue;
}

export const stringOr = (string, defaultValue) => {
    return (typeof string == 'string')
        ? string
        : defaultValue;
}

export const compareLists = (list1, list2) => {
    return list1.length == list2.length
        && list1.reduce((a, v, i) => a && list2[i] == v, true);
}
export const stringWithMaxLength = (string, maxLength) => {
    return (string.length > maxLength)
        ? string.substring(0, maxLength) + "..."
        : string;
}

export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const fullDispose = (object3d, textures) => {
    object3d.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
            if (node.geometry) {
                node.geometry.dispose();
            }

            if (node.material) {

                if (Array.isArray(node.material)) {
                    node.material.forEach((mtrl) => {
                        disposeMaterial(mtrl, textures);
                    });
                }
                else {
                    disposeMaterial(node.material, textures);
                }
            }
        }
    });
};

export const disposeMaterial = (material, textures) => {
    if(textures) {
        if(material.alphaMap) material.alphaMap.dispose();
        if(material.aoMap) material.aoMap.dispose();
        if(material.bumpMap) material.bumpMap.dispose();
        if(material.displacementMap) material.displacementMap.dispose();
        if(material.emissiveMap) material.emissiveMap.dispose();
        if(material.envMap) material.envMap.dispose();
        if(material.gradientMap) material.gradientMap.dispose();
        if(material.lightMap) material.lightMap.dispose();
        if(material.map) material.map.dispose();
        if(material.metalnessMap) material.metalnessMap.dispose();
        if(material.normalMap) material.normalMap.dispose();
        if(material.roughnessMap) material.roughnessMap.dispose();
        if(material.specularMap) material.specularMap.dispose();
    }

    material.dispose();    // disposes any programs associated with the material
};

export const buildBVH = (object3d) => {
    object3d.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
            if (node.geometry) {
                node.geometry.computeBoundsTree();
            }
        }
    });
}

//https://stackoverflow.com/questions/21711600/javascript-number-precision-without-converting-to-string
export const roundWithPrecision = (num, p) => {
    let precision = p || 9;
    return Number(num.toFixed(p));
}

THREE.Vector3.prototype.roundWithPrecision = function(p) {
    let precision = p || 9;
    let oldValues = [this.x, this.y, this.z];
    this.setX(roundWithPrecision(this.x, precision));
    this.setY(roundWithPrecision(this.y, precision));
    this.setZ(roundWithPrecision(this.z, precision));
    return this.x != oldValues[0]
        || this.y != oldValues[1]
        || this.z != oldValues[2];
}

THREE.Euler.prototype.roundWithPrecision = function(p) {
    let precision = p || 9;
    let oldValues = [this.x, this.y, this.z];
    this.set(
        roundWithPrecision(this.x, precision),
        roundWithPrecision(this.y, precision),
        roundWithPrecision(this.z, precision)
    );
    return this.x != oldValues[0]
        || this.y != oldValues[1]
        || this.z != oldValues[2];
}

THREE.Cache.enabled = true;

export const cartesianToPolar = (x, y) => {
    let r = Math.sqrt(x*x + y*y);
    let phi = Math.atan2(y, x);
    return [r, phi];
}

export const polarToCartesian = (r, phi) => {
    return [r * Math.cos(phi), r * Math.sin(phi)];
}

export const radiansToDegrees = (r) => {
    return ((r + Math.PI) / (2 * Math.PI)) * 360;
}

//https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex/44134328#44134328
function hueToRGB(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}

export const hslToRGB = (h, s, l) => {
    h /= 360;
    let r, g, b;
    if(s == 0) {
        r = g = b = l; // achromatic
    } else {
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hueToRGB(p, q, h + 1/3);
        g = hueToRGB(p, q, h);
        b = hueToRGB(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export const rgbToHex = (r, g, b) => {
    return r << 16 ^ g << 8 ^ b << 0;
}

export const rgbToHexColorString = (r, g, b) => {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
         hex = '0' + hex;
    }
    return '#' + hex;
}

export const blobToHash = (blob) => {
    return new Promise((resolve, reject) => {
        blob.arrayBuffer().then((arrayBuffer) => {
            crypto.subtle.digest("SHA-256", arrayBuffer).then((hashBuffer) => {
                let hashArray = Array.from(new Uint8Array(hashBuffer));
                let hash = hashArray.map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                resolve(hash);
            });
        });
    });
}

//https://gist.github.com/72lions/4528834
export const concatenateArrayBuffers = (...buffers) => {
    return concatenateArrayBuffersFromList(buffers);
}

export const concatenateArrayBuffersFromList = (buffers) => {
    let length = 0;
    for(let buffer of buffers) {
        length += buffer.byteLength;
    }
    let array = new Uint8Array(length);
    let index = 0;
    for(let buffer of buffers) {
        if(buffer.buffer) buffer = buffer.buffer;//Convert TypedArray
        array.set(new Uint8Array(buffer), index);
        index += buffer.byteLength;
    }
    return array.buffer;
}

export const typedArrayToArray = (typedArray) => {
    return [].slice.call(typedArray);
}

export const storeStringValuesInSet = (object, set) => {
    if(typeof object != 'object') return;
    for(let key in object) {
        let value = object[key];
        (typeof value == 'string')
            ? set.add(value)
            : storeStringValuesInSet(value, set);
    }
}

//https://dmitripavlutin.com/javascript-queue/
export class Queue {
    constructor() {
        this.items = {};
        this.headIndex = 0;
        this.tailIndex = 0;
        this.length = 0;
    }
    enqueue(item) {
        this.items[this.tailIndex] = item;
        this.tailIndex++;
        this.length++;
    }
    dequeue() {
        const item = this.items[this.headIndex];
        delete this.items[this.headIndex];
        this.headIndex++;
        this.length--;
        return item;
    }
    peek() {
        return this.items[this.headIndex];
    }
}
