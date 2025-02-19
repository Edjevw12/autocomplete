import { defer } from '../../../../../test/utils';
import { createConcurrentSafePromise } from '../createConcurrentSafePromise';

describe('createConcurrentSafePromise', () => {
  test('resolves the non-promise values in order', async () => {
    const runConcurrentSafePromise = createConcurrentSafePromise();
    const concurrentSafePromise1 = runConcurrentSafePromise({ value: 1 });
    const concurrentSafePromise2 = runConcurrentSafePromise({ value: 2 });
    const concurrentSafePromise3 = runConcurrentSafePromise({ value: 3 });

    jest.runAllTimers();

    expect(await concurrentSafePromise1).toEqual({ value: 1 });
    expect(await concurrentSafePromise2).toEqual({ value: 2 });
    expect(await concurrentSafePromise3).toEqual({ value: 3 });
  });

  test('resolves the values in order when sequenced', async () => {
    const runConcurrentSafePromise = createConcurrentSafePromise();
    const concurrentSafePromise1 = runConcurrentSafePromise(
      defer(() => ({ value: 1 }), 100)
    );
    const concurrentSafePromise2 = runConcurrentSafePromise(
      defer(() => ({ value: 2 }), 200)
    );
    const concurrentSafePromise3 = runConcurrentSafePromise(
      defer(() => ({ value: 3 }), 300)
    );

    jest.runAllTimers();

    expect(await concurrentSafePromise1).toEqual({ value: 1 });
    expect(await concurrentSafePromise2).toEqual({ value: 2 });
    expect(await concurrentSafePromise3).toEqual({ value: 3 });
  });

  test('resolves the value from the last call', async () => {
    const runConcurrentSafePromise = createConcurrentSafePromise();
    const concurrentSafePromise1 = runConcurrentSafePromise(
      defer(() => ({ value: 1 }), 100)
    );
    const concurrentSafePromise2 = runConcurrentSafePromise(
      defer(() => ({ value: 2 }), 500)
    );
    const concurrentSafePromise3 = runConcurrentSafePromise(
      defer(() => ({ value: 3 }), 200)
    );

    jest.runAllTimers();

    expect(await concurrentSafePromise1).toEqual({ value: 1 });
    // `concurrentSafePromise2` resolved after `concurrentSafePromise3`
    // and is now outdated, so the resolved value from `concurrentSafePromise3`
    // is returned.
    expect(await concurrentSafePromise2).toEqual({ value: 3 });
    expect(await concurrentSafePromise3).toEqual({ value: 3 });
  });

  test('returns whether promises are currently running', async () => {
    const runConcurrentSafePromise = createConcurrentSafePromise();
    const concurrentSafePromise1 = runConcurrentSafePromise(
      defer(() => ({ value: 1 }), 0)
    );
    const concurrentSafePromise2 = runConcurrentSafePromise(
      defer(() => ({ value: 2 }), 0)
    );
    const concurrentSafePromise3 = runConcurrentSafePromise(
      defer(() => ({ value: 3 }), 0)
    );

    jest.runAllTimers();

    expect(runConcurrentSafePromise.isRunning()).toBe(true);

    await concurrentSafePromise1;
    await concurrentSafePromise2;

    expect(runConcurrentSafePromise.isRunning()).toBe(true);

    await concurrentSafePromise3;

    expect(runConcurrentSafePromise.isRunning()).toBe(false);

    const concurrentSafePromise4 = runConcurrentSafePromise(
      defer(() => Promise.reject(new Error()), 400)
    );

    expect(runConcurrentSafePromise.isRunning()).toBe(true);

    try {
      await concurrentSafePromise4;
      // eslint-disable-next-line no-empty
    } catch (err) {}

    expect(runConcurrentSafePromise.isRunning()).toBe(false);
  });
});
