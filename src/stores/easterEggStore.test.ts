import { beforeEach, describe, expect, test } from 'vitest';
import { ERROR_CASCADE_CAP, useEasterEggStore } from './easterEggStore';

beforeEach(() => {
  useEasterEggStore.setState({ bsodActive: false, errorDialogs: [], errorSpawnedCount: 0 });
});

describe('bsod', () => {
  test('triggerBsod / dismissBsod toggle bsodActive', () => {
    useEasterEggStore.getState().triggerBsod();
    expect(useEasterEggStore.getState().bsodActive).toBe(true);
    useEasterEggStore.getState().dismissBsod();
    expect(useEasterEggStore.getState().bsodActive).toBe(false);
  });
});

describe('error cascade', () => {
  test('triggering starts with exactly one dialog', () => {
    useEasterEggStore.getState().triggerErrorCascade();
    expect(useEasterEggStore.getState().errorDialogs).toHaveLength(1);
    expect(useEasterEggStore.getState().errorSpawnedCount).toBe(1);
  });

  test('closing a dialog spawns two more while under the cap', () => {
    useEasterEggStore.getState().triggerErrorCascade();
    const first = useEasterEggStore.getState().errorDialogs[0];
    expect(first).toBeDefined();
    useEasterEggStore.getState().closeErrorDialog(first?.id ?? '');

    expect(useEasterEggStore.getState().errorDialogs).toHaveLength(2);
    expect(useEasterEggStore.getState().errorSpawnedCount).toBe(3);
  });

  test('never spawns more than ERROR_CASCADE_CAP dialogs in total', () => {
    useEasterEggStore.getState().triggerErrorCascade();
    // Repeatedly close whatever dialog is open until the cascade exhausts its budget.
    for (let i = 0; i < 50; i++) {
      const dialogs = useEasterEggStore.getState().errorDialogs;
      const target = dialogs[0];
      if (target === undefined) break;
      useEasterEggStore.getState().closeErrorDialog(target.id);
    }
    expect(useEasterEggStore.getState().errorSpawnedCount).toBeLessThanOrEqual(ERROR_CASCADE_CAP);
    expect(useEasterEggStore.getState().errorDialogs).toHaveLength(0);
  });

  test('closing a dialog that is not the last one still closes just that one', () => {
    useEasterEggStore.setState({
      errorDialogs: [
        { id: 'a', x: 0, y: 0, message: 'x' },
        { id: 'b', x: 0, y: 0, message: 'y' },
      ],
      errorSpawnedCount: 20,
    });
    useEasterEggStore.getState().closeErrorDialog('a');
    const ids = useEasterEggStore.getState().errorDialogs.map((d) => d.id);
    expect(ids).toEqual(['b']);
  });
});
