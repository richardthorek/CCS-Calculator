/**
 * Tests for debounce utility functions
 */

import { debounce, throttle } from '../../src/js/utils/debounce.js';

describe('debounce', () => {
  test('should delay function execution', (done) => {
    let callCount = 0;
    const func = () => { callCount++; };
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    expect(callCount).toBe(0);

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 150);
  });

  test('should only execute once for multiple rapid calls', (done) => {
    let callCount = 0;
    const func = () => { callCount++; };
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    expect(callCount).toBe(0);

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 150);
  });

  test('should reset timer on each call', (done) => {
    let callCount = 0;
    const func = () => { callCount++; };
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    
    setTimeout(() => {
      debouncedFunc(); // Reset timer
      
      setTimeout(() => {
        expect(callCount).toBe(0);
      }, 50);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    }, 50);
  });

  test('should pass arguments correctly', (done) => {
    let capturedArgs = null;
    const func = (...args) => { capturedArgs = args; };
    const debouncedFunc = debounce(func, 50);

    debouncedFunc('arg1', 'arg2', 123);
    
    setTimeout(() => {
      expect(capturedArgs).toEqual(['arg1', 'arg2', 123]);
      done();
    }, 100);
  });

  test('should execute immediately when immediate flag is true', () => {
    let callCount = 0;
    const func = () => { callCount++; };
    const debouncedFunc = debounce(func, 100, true);

    debouncedFunc();
    expect(callCount).toBe(1);

    // Subsequent calls within wait period should not execute
    debouncedFunc();
    debouncedFunc();
    expect(callCount).toBe(1);
  });

  test('should preserve context', (done) => {
    const context = { value: 42 };
    let capturedContext = null;
    const func = function() {
      capturedContext = this;
      return this.value;
    };
    const debouncedFunc = debounce(func, 50);

    debouncedFunc.call(context);
    
    setTimeout(() => {
      expect(capturedContext).toBe(context);
      expect(capturedContext.value).toBe(42);
      done();
    }, 100);
  });
});

describe('throttle', () => {
  test('should execute function immediately on first call', () => {
    let callCount = 0;
    const func = () => { callCount++; };
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    expect(callCount).toBe(1);
  });

  test('should ignore calls within throttle period', () => {
    let callCount = 0;
    const func = () => { callCount++; };
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    throttledFunc();
    throttledFunc();

    expect(callCount).toBe(1);
  });

  test('should allow execution after throttle period expires', (done) => {
    let callCount = 0;
    const func = () => { callCount++; };
    const throttledFunc = throttle(func, 50);

    throttledFunc();
    expect(callCount).toBe(1);

    setTimeout(() => {
      throttledFunc();
      expect(callCount).toBe(2);
      done();
    }, 100);
  });

  test('should pass arguments correctly', () => {
    let capturedArgs = null;
    const func = (...args) => { capturedArgs = args; };
    const throttledFunc = throttle(func, 100);

    throttledFunc('test', 123);
    expect(capturedArgs).toEqual(['test', 123]);
  });

  test('should preserve context', () => {
    const context = { value: 42 };
    let capturedContext = null;
    const func = function() {
      capturedContext = this;
      return this.value;
    };
    const throttledFunc = throttle(func, 100);

    throttledFunc.call(context);
    expect(capturedContext).toBe(context);
    expect(capturedContext.value).toBe(42);
  });
});
