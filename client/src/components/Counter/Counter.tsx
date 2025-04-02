
import { useCounterStore, CounterState, initCounter } from './Script'; // Import from Script.ts and include initCounter
// import './Counter.css'; // Removed as styles are handled by Mantine
import { Button, Text, Paper } from '@mantine/core'; // Import Mantine components

function Counter() {
  // Call the initialization logic from Script.ts
  // This ensures the logic runs when the component first renders,
  // but the logic itself resides outside the component.
  initCounter();

  // Select necessary state and actions for rendering
  const currentCount = useCounterStore((state: CounterState) => state.count);
  const incrementAction = useCounterStore((state: CounterState) => state.increment);

  return (
    // Using Paper for themed container and spacing
    <Paper withBorder shadow="xs" p="md" style={{ textAlign: 'center', margin: '1rem' }}>
      <Text>This is the Counter component using Mantine.</Text>
      <Button onClick={incrementAction} mt="sm">
        Clicked {currentCount} times
      </Button>
    </Paper>
  );
}

export default Counter;
