import { expect, jest, test, beforeEach } from '@jest/globals';
import PointerInteractable from '../../../../scripts/core/interactables/PointerInteractable.js';

import ToolHandler from '../../../../scripts/core/handlers/ToolHandler.js';


let pointerInteractable;

function createThreeObj() {
    return {
        pointerInteractable: null,
    };
}

beforeEach(() => {
    pointerInteractable = new PointerInteractable(createThreeObj(), true, null);
    jest.clearAllMocks();
});

test('action triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn());
    pointerInteractable.triggerActions(null, null, 0);
    expect(receivedAction.clickAction).toHaveBeenCalled();
});

test('multiple actions triggered', () => {
    const receivedAction1 = pointerInteractable.addAction(jest.fn());
    const receivedAction2 = pointerInteractable.addAction(jest.fn());
    pointerInteractable.triggerActions(null, null, 0);
    expect(receivedAction1.clickAction).toHaveBeenCalled();
    expect(receivedAction2.clickAction).toHaveBeenCalled();
});

test('action for tool triggered', () => {
    ToolHandler.setTool('mockTool');
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0, ToolHandler.getTool());
    pointerInteractable.triggerActions(null, null, 0);
    expect(receivedAction.clickAction).toHaveBeenCalled();
});

test('action for different tool not triggered', () => {
    ToolHandler.setTool('mockTool');
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 0, 'differentTool');
    pointerInteractable.triggerActions(null, null, 0);
    expect(receivedAction.clickAction).not.toHaveBeenCalled();
});

test('action with maxDistance triggered', () => {
    const receivedAction = pointerInteractable.addAction(jest.fn(), null, 100);
    pointerInteractable.triggerActions(null, null, 50);
    expect(receivedAction.clickAction).toHaveBeenCalled();
});