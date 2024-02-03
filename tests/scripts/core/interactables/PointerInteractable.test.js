import { expect, jest, test, beforeEach } from '@jest/globals';
import PointerInteractable from '../../../../scripts/core/interactables/PointerInteractable.js';

import ToolHandler from '../../../../scripts/core/handlers/ToolHandler.js';


let pointerInteractable;

function createThreeObj() {
    return {
        pointerInteractable: null,
    };
}

const dummyOwner = 'dummyOwner';
const dummyClosestPoint = 10;

beforeEach(() => {
    pointerInteractable = new PointerInteractable(createThreeObj(), true, null);
    jest.clearAllMocks();
});

test('action triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn());
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});

test('multiple actions triggered', () => {
    const receivedAction1 = pointerInteractable.addAction(jest.fn());
    const receivedAction2 = pointerInteractable.addAction(jest.fn());
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction1.clickAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
    expect(receivedAction2.clickAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});

test('action for tool triggered', () => {
    ToolHandler.setTool('mockTool');
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0, ToolHandler.getTool());
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});

test('action for different tool not triggered', () => {
    ToolHandler.setTool('mockTool');
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0, 'differentTool');
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('action with maxDistance triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 100);
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 50);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});

test('action with maxDistance not triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 100);
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 110);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('removed action not triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0);
    pointerInteractable.removeAction(receivedAction.id);
    pointerInteractable.triggerActions(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('action triggered by state change', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0);
    pointerInteractable.addSelectedBy(dummyOwner, dummyClosestPoint, 0);
    pointerInteractable.addHoveredBy(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction.clickAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});

test('action not triggered by state changes from different owners', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0);
    pointerInteractable.addSelectedBy(dummyOwner, dummyClosestPoint, 0);
    pointerInteractable.addHoveredBy("differentOwner", dummyClosestPoint, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('draggable action triggered', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 0);
    pointerInteractable.triggerDraggableActions(dummyOwner, dummyClosestPoint, 0);
    expect(receivedAction.draggableAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});

test('draggable action with maxDistance triggered', () => {
    const receivedAction = pointerInteractable.addAction(null, jest.fn(), 100);
    pointerInteractable.triggerDraggableActions(dummyOwner, dummyClosestPoint, 50);
    expect(receivedAction.draggableAction).toHaveBeenCalledWith(dummyOwner, dummyClosestPoint);
});