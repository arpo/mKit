
import { useCounterStore, CounterState, initCounter } from './Script'; // Import from Script.ts and include initCounter
import './Counter.css';

function Counter() {
  // Call the initialization logic from Script.ts
  // This ensures the logic runs when the component first renders,
  // but the logic itself resides outside the component.
  initCounter();

  // Select necessary state and actions for rendering
  const currentCount = useCounterStore((state: CounterState) => state.count);
  const incrementAction = useCounterStore((state: CounterState) => state.increment);

  return (
    <div className="counter-container">
      <p>This is the Counter component.</p>
      <button onClick={incrementAction}>
        Clicked {currentCount} times
      </button>
    </div>
  );
}

export default Counter;
