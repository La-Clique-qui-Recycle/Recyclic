import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Operator {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface OperatorState {
  currentOperator: Operator | null;
  isLocked: boolean;
  setCurrentOperator: (operator: Operator) => void;
  lock: () => void;
  unlock: () => void;
  clearOperator: () => void;
}

export const useOperatorStore = create<OperatorState>()(
  persist(
    (set) => ({
      currentOperator: null,
      isLocked: false,

      setCurrentOperator: (operator) => set({ currentOperator: operator, isLocked: false }),

      lock: () => set({ isLocked: true }),

      unlock: () => set({ isLocked: false }),

      clearOperator: () => set({ currentOperator: null, isLocked: false }),
    }),
    {
      name: 'operator-storage',
    }
  )
);
