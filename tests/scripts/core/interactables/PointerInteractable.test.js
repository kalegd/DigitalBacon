import { expect, jest, test, beforeEach } from '@jest/globals';
import PointerInteractable from '../../../../scripts/core/interactables/PointerInteractable.js';


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