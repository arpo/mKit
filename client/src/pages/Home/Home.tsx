import { Button } from '@mantine/core'; // Import Button
import DropArea from '../../components/DropArea/DropArea'; // Import the new component
import { useDropAreaStore, DropAreaState } from '../../components/DropArea/Script'; // Import store and state for DropArea
// import { useHomeStore } from './Script'; // Corrected path if needed later

function Home() {
  // Get the dropped files state from the DropArea store
  const droppedFiles = useDropAreaStore((state: DropAreaState) => state.droppedFiles);

  // Placeholder action for the button
  const handleStartClick = () => {
    console.log('Start button clicked. Files:', droppedFiles);
    // Add logic here to process the droppedFiles
  };

  // const { someState, someAction } = useHomeStore.getState(); // Example access

  // Initialize logic if needed (following the no-useEffect pattern)
  // if (!initialDataLoaded) {
  //   loadDataAction();
  // }

  return (
    <div>
      <h1>mKit</h1>
      <p>Upload your audio file below:</p>
      <DropArea />
      {/* Conditionally render the Start button */}
      {droppedFiles.length > 0 && (
        <Button onClick={handleStartClick} mt="md">
          Start
        </Button>
      )}
    </div>
  );
}

export default Home;
