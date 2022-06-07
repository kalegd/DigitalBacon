/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
  
export default class Avatar {
    constructor(params) {
        if(params == null) {
            params = {};
        }
        let verticalOffset = params['Vertical Offset'] || 0;
        let focusCamera = params['Focus Camera'] || false;
        let cameraFocalPoint = params['Camera Focal Point'] || [0,1.7,0];
        this._defaultURL = 'https://d1a370nemizbjq.cloudfront.net/6a141c79-d6e5-4b0d-aa0d-524a8b9b54a4.glb';
        this._pivotPoint = new THREE.Object3D();
        this._pivotPoint.position.setY(verticalOffset);
        this._createBoundingBox(params);
        //this._pivotPoint.position.setY(1.3);

        this._createMesh((params['URL']) ? params['URL'] : this._defaultURL);
        if(focusCamera) {
            global.cameraFocus.position.fromArray(cameraFocalPoint);
        }
    }

    _createBoundingBox(params) {
        let boundingBoxSize = (params['Bounding Box Size'])
            ? params['Bounding Box Min']
            : [0.2, 0.8, 0.2];
        let boundingBoxCenter = (params['Bounding Box Center'])
            ? params['Bounding Box Max']
            : [0, 0.4, 0];
        let boundingBoxQuaternion = (params['Bounding Box Quaternion'])
            ? params['Bounding Box Quaternion']
            : [0, 0, 0, 0];
        let geometry = new THREE.BoxGeometry(
            boundingBoxSize[0],
            boundingBoxSize[1],
            boundingBoxSize[2],
        );
        let material = new THREE.MeshBasicMaterial({ wireframe: true });
        this._boundingBox = new THREE.Mesh(geometry, material);
        this._boundingBox.position.fromArray(boundingBoxCenter);
        this._boundingBox.quaternion.fromArray(boundingBoxQuaternion);
        //this._pivotPoint.add(this._boundingBox);
    }

    _createMesh(filename) {
        if(/\.glb$/.test(filename)) {
            let gltfLoader = new GLTFLoader();
            gltfLoader.load(filename, (gltf) => {
                gltf.scene.rotateY(Math.PI);
                if(gltf.scene.children[0].name.includes("AvatarRoot")) {
                    let hands = new Set();
                    gltf.scene.traverse((child) => {
                        if(child.name.toLowerCase().includes("hand")) {
                            hands.add(child);
                        }
                    });
                    hands.forEach((hand) => { hand.parent.remove(hand); });
                    gltf.scene.position.setY(-0.7);
                }
                this._pivotPoint.add(gltf.scene);
                this._dimensions = 3;
            }, () => {}, (error) => {
                console.log(error);
                if(filename != this._defaultURL) {
                    this._createMesh(this._defaultURL);
                } else {
                    console.error("Can't display default avatar :(");
                }
            });
        } else if(/\.png$|\.jpg$|\.jpeg$/.test(filename)) {
            new THREE.TextureLoader().load(filename, (texture) => {
                let width = texture.image.width;
                let height = texture.image.height;
                if(width > height) {
                    let factor = 0.3 / width;
                    width = 0.3;
                    height *= factor;
                } else {
                    let factor = 0.3 / height;
                    height = 0.3;
                    width *= factor;
                }
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                });
                let geometry = new THREE.PlaneBufferGeometry(width, height);
                geometry.rotateY(Math.PI);
                let mesh = new THREE.Mesh(geometry, material);
                this._pivotPoint.add(mesh);
                //let sprite = new THREE.Sprite(material);
                //this._pivotPoint.add(sprite);
                this._dimensions = 2;
            }, () => {}, () => {
                if(filename != this._defaultURL) {
                    this._createMesh(this._defaultURL);
                } else {
                    console.error("Can't display default avatar :(");
                }
            });
        } else {
            if(filename != this._defaultURL) {
                this._createMesh(this._defaultURL);
            } else {
                console.error("Default avatar URL is invalid :(");
            }
        }
    }

    lookAtLocal(point) {
        if(this._pivotPoint.parent) {
            vector3s[0].copy(point);
            this._pivotPoint.parent.localToWorld(vector3s[0]);
            this._pivotPoint.lookAt(vector3s[0]);
        }
    }

    updateSourceUrl(url) {
        while(this._pivotPoint.children[0]) {
            let child = this._pivotPoint.children[0];
            this._pivotPoint.remove(child);
            fullDispose(child, true);
        }
        this._createMesh(url);
    }

    getObject() {
        return this._pivotPoint;
    }

    addToScene(scene) {
        scene.add(this._pivotPoint);
    }

    removeFromScene() {
        if(this._pivotPoint.parent) {
            this._pivotPoint.parent.remove(this._pivotPoint);
            fullDispose(this._pivotPoint, true);
        }
    }
}
