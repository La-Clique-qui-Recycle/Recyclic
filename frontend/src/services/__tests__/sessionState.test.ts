import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StepStateManager, useStepState } from '../sessionState';

describe('StepStateManager', () => {
  let manager: StepStateManager;

  beforeEach(() => {
    // Reset singleton instance for each test
    (StepStateManager as any).instance = null;
    manager = StepStateManager.getInstance();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('initial state', () => {
    it('starts with category step active', () => {
      const state = manager.getState();
      expect(state.currentStep).toBe('category');
      expect(state.categoryState).toBe('active');
      expect(state.weightState).toBe('inactive');
      expect(state.validationState).toBe('inactive');
    });

    it('has step start time set', () => {
      const state = manager.getState();
      expect(state.stepStartTime).toBeInstanceOf(Date);
      expect(state.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('step transitions', () => {
    it('transitions from category to weight', () => {
      manager.handleCategorySelected();

      const state = manager.getState();
      expect(state.currentStep).toBe('weight');
      expect(state.categoryState).toBe('completed');
      expect(state.weightState).toBe('active');
      expect(state.validationState).toBe('inactive');
    });

    it('transitions from weight to validation', () => {
      manager.transitionToStep('weight');
      manager.handleWeightInputCompleted();

      const state = manager.getState();
      expect(state.currentStep).toBe('validation');
      expect(state.categoryState).toBe('completed');
      expect(state.weightState).toBe('completed');
      expect(state.validationState).toBe('active');
    });

    it('transitions from validation back to category', () => {
      manager.transitionToStep('validation');
      manager.handleItemValidated();

      const state = manager.getState();
      expect(state.currentStep).toBe('category');
      expect(state.categoryState).toBe('active');
      expect(state.weightState).toBe('inactive');
      expect(state.validationState).toBe('inactive');
    });

    it('handles ticket closed by resetting to category', () => {
      manager.transitionToStep('validation');
      manager.handleTicketClosed();

      const state = manager.getState();
      expect(state.currentStep).toBe('category');
      expect(state.categoryState).toBe('active');
    });
  });

  describe('activity tracking', () => {
    it('updates last activity on transitions', () => {
      const beforeTransition = manager.getState().lastActivity;

      // Wait a bit
      setTimeout(() => {
        manager.transitionToStep('weight');
        const afterTransition = manager.getState().lastActivity;
        expect(afterTransition.getTime()).toBeGreaterThan(beforeTransition.getTime());
      }, 1);
    });

    it('updates step start time on transitions', () => {
      const beforeTransition = manager.getState().stepStartTime;

      setTimeout(() => {
        manager.transitionToStep('weight');
        const afterTransition = manager.getState().stepStartTime;
        expect(afterTransition!.getTime()).toBeGreaterThan(beforeTransition!.getTime());
      }, 1);
    });
  });

  describe('inactivity timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllTimers();
    });

    it('resets to category after inactivity timeout', () => {
      // Start with validation step
      manager.transitionToStep('validation');
      expect(manager.getState().currentStep).toBe('validation');

      // Fast-forward past inactivity timeout (5 minutes + 1ms)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      const state = manager.getState();
      expect(state.currentStep).toBe('category');
      expect(state.categoryState).toBe('active');
    });

    it('resets inactivity timer on activity', () => {
      // Start with weight step
      manager.transitionToStep('weight');

      // Advance 4 minutes (should not timeout yet)
      vi.advanceTimersByTime(4 * 60 * 1000);

      // Trigger activity
      manager.handleWeightInputStarted();

      // Advance another 4 minutes (should still not timeout)
      vi.advanceTimersByTime(4 * 60 * 1000);

      const state = manager.getState();
      expect(state.currentStep).toBe('weight');
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const manager1 = StepStateManager.getInstance();
      const manager2 = StepStateManager.getInstance();
      expect(manager1).toBe(manager2);
    });
  });

  describe('subscription system', () => {
    it('notifies listeners on state change', () => {
      const mockCallback = vi.fn();
      const unsubscribe = manager.subscribe(mockCallback);

      manager.transitionToStep('weight');

      expect(mockCallback).toHaveBeenCalledWith(manager.getState());

      unsubscribe();
    });

    it('stops notifying after unsubscribe', () => {
      const mockCallback = vi.fn();
      const unsubscribe = manager.subscribe(mockCallback);

      unsubscribe();
      manager.transitionToStep('weight');

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('weight input handling', () => {
    it('handles weight input started correctly', () => {
      manager.transitionToStep('weight');
      const beforeActivity = manager.getState().lastActivity;

      setTimeout(() => {
        manager.handleWeightInputStarted();
        const afterActivity = manager.getState().lastActivity;
        expect(afterActivity.getTime()).toBeGreaterThan(beforeActivity.getTime());
      }, 1);
    });

    it('does not transition on weight input started if not on weight step', () => {
      manager.transitionToStep('category');
      manager.handleWeightInputStarted();

      expect(manager.getState().currentStep).toBe('category');
    });
  });
});


