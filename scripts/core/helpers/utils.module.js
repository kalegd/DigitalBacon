/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as THREE from 'three';

export const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c^crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
};

export const numberOr = (number, defaultValue) => {
    return (typeof number == 'number')
        ? number
        : defaultValue;
}

export const stringWithMaxLength = (string, maxLength) => {
    return (string.length > maxLength)
        ? string.substring(0, maxLength) + "..."
        : string;
}

export const fullDispose = (object3d, textures) => {
    object3d.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
            if (node.geometry) {
                node.geometry.dispose();
            }

            if (node.material) {

                if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                    node.material.materials.forEach((mtrl, idx) => {
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

//https://stackoverflow.com/questions/21711600/javascript-number-precision-without-converting-to-string
export const roundWithPrecision = (num, p) => {
    let precision = p || 9;
    let multiplier = Math.pow(10, precision);
    return Math.round( num * multiplier ) / multiplier;
}

THREE.Vector3.prototype.roundWithPrecision = function(p) {
    let precision = p || 9;
    this.setX(roundWithPrecision(this.x, precision));
    this.setY(roundWithPrecision(this.y, precision));
    this.setZ(roundWithPrecision(this.z, precision));
}

THREE.Euler.prototype.roundWithPrecision = function(p) {
    let precision = p || 9;
    this.set(
        roundWithPrecision(this.x, precision),
        roundWithPrecision(this.y, precision),
        roundWithPrecision(this.z, precision)
    );
}

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

export const rgbToHex = (rgb) => {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
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
