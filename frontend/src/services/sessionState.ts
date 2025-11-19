import { useCallback, useEffect, useState } from 'react';
import { StepState } from '../components/ui/StepIndicator';

export type ReceptionStep = 'category' | 'weight' | 'validation';

export interface StepStateInfo {
  currentStep: ReceptionStep;
  categoryState: StepState;
  weightState: StepState;
  validationState: StepState;
  stepStartTime: Date | null;
  lastActivity: Date;
}

export interface SessionMetrics {
  current_step: 'entry' | 'sale' | 'exit';
  last_activity: string;
  step_start_time: string | null;
}

class StepStateManager {
  private static instance: StepStateManager;
  private listeners: Set<(state: StepStateInfo) => void> = new Set();
  private inactivityTimeoutId: number | null = null;
  private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  private state: StepStateInfo = {
    currentStep: 'category',
    categoryState: 'active',
    weightState: 'inactive',
    validationState: 'inactive',
    stepStartTime: new Date(),
    lastActivity: new Date(),
  };

  static getInstance(): StepStateManager {
    if (!StepStateManager.instance) {
      StepStateManager.instance = new StepStateManager();
    }
    return StepStateManager.instance;
  }

  private constructor() {
    this.startInactivityTimer();
  }

  // Get current state
  getState(): StepStateInfo {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(callback: (state: StepStateInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of state change
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getState()));
  }

  // Reset inactivity timer
  private resetInactivityTimer(): void {
    this.state.lastActivity = new Date();
    this.startInactivityTimer();
  }

  // Start inactivity timer
  private startInactivityTimer(): void {
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
    }

    this.inactivityTimeoutId = window.setTimeout(() => {
      // Auto-transition to category step after inactivity
      this.transitionToStep('category');
    }, this.INACTIVITY_TIMEOUT);
  }

  // Transition to a specific step
  transitionToStep(step: ReceptionStep): void {
    const now = new Date();

    // Update step states
    this.state.currentStep = step;
    this.state.stepStartTime = now;
    this.state.lastActivity = now;

    // Reset all states to inactive
    this.state.categoryState = 'inactive';
    this.state.weightState = 'inactive';
    this.state.validationState = 'inactive';

    // Set current step to active
    switch (step) {
      case 'category':
        this.state.categoryState = 'active';
        break;
      case 'weight':
        this.state.weightState = 'active';
        // Mark category as completed
        this.state.categoryState = 'completed';
        break;
      case 'validation':
        this.state.validationState = 'active';
        // Mark previous steps as completed
        this.state.categoryState = 'completed';
        this.state.weightState = 'completed';
        break;
    }

    this.resetInactivityTimer();
    this.notifyListeners();
    this.syncWithBackend();
  }

  // Handle category selection
  handleCategorySelected(): void {
    if (this.state.currentStep === 'category') {
      this.transitionToStep('weight');
    }
  }

  // Handle weight input started
  handleWeightInputStarted(): void {
    if (this.state.currentStep === 'weight') {
      // Weight step is already active, just update activity
      this.resetInactivityTimer();
    }
  }

  // Handle weight input completed
  handleWeightInputCompleted(): void {
    if (this.state.currentStep === 'weight') {
      this.transitionToStep('validation');
    }
  }

  // Handle item added/validated
  handleItemValidated(): void {
    if (this.state.currentStep === 'validation') {
      // After validation, return to category for next item
      this.transitionToStep('category');
    }
  }

  // Handle ticket closed
  handleTicketClosed(): void {
    // Reset to initial state
    this.transitionToStep('category');
  }

  // Sync state with backend
  private async syncWithBackend(): Promise<void> {
    try {
      const sessionId = this.getCurrentSessionId();
      if (!sessionId) return;

      const metrics: SessionMetrics = {
        current_step: 'entry', // Always 'entry' for reception tickets
        last_activity: this.state.lastActivity.toISOString(),
        step_start_time: this.state.stepStartTime?.toISOString() || null,
      };

      // TODO: Implement API call to sync metrics
      // await cashSessionService.updateSessionMetrics(sessionId, metrics);
      console.log('Syncing session metrics:', metrics);
    } catch (error) {
      console.error('Failed to sync session metrics:', error);
    }
  }

  // Get current session ID (placeholder - needs to be connected to actual session management)
  private getCurrentSessionId(): string | null {
    // This should be connected to the actual session management
    // For now, return null to avoid API calls during development
    return null;
  }

  // Initialize from backend state
  async initializeFromBackend(): Promise<void> {
    try {
      const sessionId = this.getCurrentSessionId();
      if (!sessionId) return;

      // TODO: Implement API call to get current metrics
      // const metrics = await cashSessionService.getSessionMetrics(sessionId);

      // For now, initialize with default state
      this.transitionToStep('category');
    } catch (error) {
      console.error('Failed to initialize from backend:', error);
      // Fallback to default state
      this.transitionToStep('category');
    }
  }

  // Cleanup
  destroy(): void {
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
      this.inactivityTimeoutId = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
const stepStateManager = StepStateManager.getInstance();

// React hook for using step state
export function useStepState(): {
  stepState: StepStateInfo;
  transitionToStep: (step: ReceptionStep) => void;
  handleCategorySelected: () => void;
  handleWeightInputStarted: () => void;
  handleWeightInputCompleted: () => void;
  handleItemValidated: () => void;
  handleTicketClosed: () => void;
} {
  const [stepState, setStepState] = useState<StepStateInfo>(stepStateManager.getState());

  useEffect(() => {
    const unsubscribe = stepStateManager.subscribe(setStepState);
    return unsubscribe;
  }, []);

  return {
    stepState,
    transitionToStep: useCallback((step: ReceptionStep) => stepStateManager.transitionToStep(step), []),
    handleCategorySelected: useCallback(() => stepStateManager.handleCategorySelected(), []),
    handleWeightInputStarted: useCallback(() => stepStateManager.handleWeightInputStarted(), []),
    handleWeightInputCompleted: useCallback(() => stepStateManager.handleWeightInputCompleted(), []),
    handleItemValidated: useCallback(() => stepStateManager.handleItemValidated(), []),
    handleTicketClosed: useCallback(() => stepStateManager.handleTicketClosed(), []),
  };
}

export { stepStateManager };
export default StepStateManager;


