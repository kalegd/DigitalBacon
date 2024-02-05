import { expect, jest, test, beforeEach } from '@jest/globals';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';

import ToolHandler from '/scripts/core/handlers/ToolHandler.js';

import * as THREE from 'three';


let pointerInteractable;

function createThreeObj() {
    return new THREE.Object3D();
}

const sampleOwner = 'sampleOwner';
const sampleClosestPoint = new THREE.Vector3();

beforeEach(() => {
    pointerInteractable = new PointerInteractable(createThreeObj(), true, null);
    jest.clearAllMocks();
});

test('action triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn());
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('multiple actions triggered', () => {
    const receivedAction1 = pointerInteractable.addAction(jest.fn());
    const receivedAction2 = pointerInteractable.addAction(jest.fn());
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction1.clickAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
    expect(receivedAction2.clickAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('action for tool triggered', () => {
    ToolHandler.setTool('mockTool');
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0, ToolHandler.getTool());
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('action for different tool not triggered', () => {
    ToolHandler.setTool('mockTool');
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0, 'differentTool');
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('action with maxDistance triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 100);
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 50);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('action with maxDistance not triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 100);
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 110);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('removed action not triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0);
    pointerInteractable.removeAction(receivedAction.id);
    pointerInteractable.triggerActions(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('action triggered by state change', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0);
    pointerInteractable.addSelectedBy(sampleOwner, sampleClosestPoint, 0);
    pointerInteractable.addHoveredBy(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('action not triggered by state changes from different owners', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0);
    pointerInteractable.addSelectedBy(sampleOwner, sampleClosestPoint, 0);
    pointerInteractable.addHoveredBy("differentOwner", sampleClosestPoint, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('draggable action triggered', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 0);
    pointerInteractable.triggerDraggableActions(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.draggableAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('draggable action with maxDistance triggered', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 100);
    pointerInteractable.triggerDraggableActions(sampleOwner, sampleClosestPoint, 50);
    expect(receivedAction.draggableAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});

test('draggable action with maxDistance not triggered', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 100);
    pointerInteractable.triggerDraggableActions(sampleOwner, sampleClosestPoint, 110);
    expect(receivedAction.draggableAction).not.toHaveBeenCalled();
});

test('draggable action with maxDistance going out of range still triggered', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 100);
    pointerInteractable.triggerDraggableActions(sampleOwner, sampleClosestPoint, 50);
    pointerInteractable.triggerDraggableActions(sampleOwner, sampleClosestPoint, 110);
    expect(receivedAction.draggableAction).toHaveBeenCalledTimes(2);
});

test('draggable action triggered by state change', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 0);
    pointerInteractable.addSelectedBy(sampleOwner, sampleClosestPoint, 0);
    expect(receivedAction.draggableAction).toHaveBeenCalledWith(sampleOwner, sampleClosestPoint);
});