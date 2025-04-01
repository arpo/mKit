import { create } from 'zustand';

// Define the state shape and actions with TypeScript types
export interface CounterState { // <-- Add export here
  count: number;
  increment: () => void;
  // Add other state properties and actions here if needed
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Initialization logic function, exported for use in the component
export function initCounter() {
  const { count, increment } = useCounterStore.getState(); // Get current state and actions
  if (count === 0) {
    increment(); // Call the increment action directly from the store
    console.log("Counter initialized via initCounter(), incrementing count.");
  }
}

// Other non-state logic or helper functions can go here
