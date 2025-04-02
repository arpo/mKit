import { Button, LoadingOverlay, Text } from '@mantine/core'; // Import Button, LoadingOverlay, and Text
import DropArea from '../../components/DropArea/DropArea'; // Import the new component
import { useDropAreaStore, DropAreaState, DropAreaActions } from '../../components/DropArea/Script'; // Import store, state and actions
// import { useHomeStore } from './Script'; // Corrected path if needed later

function Home() {
  // Get state and actions from the DropArea store
  const droppedFiles = useDropAreaStore((state: DropAreaState) => state.droppedFiles);
  const isLoading = useDropAreaStore((state: DropAreaState) => state.isLoading);
  const predictionResult = useDropAreaStore((state: DropAreaState) => state.predictionResult); // Get result state
  const error = useDropAreaStore((state: DropAreaState) => state.error); // Get error state
  const { uploadAudio } = useDropAreaStore.getState(); // Get the upload action

  // Call the upload action when the button is clicked
  const handleStartClick = () => {
    uploadAudio();
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
      {/* Wrap DropArea and Button in a relative div for LoadingOverlay */}
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <DropArea />
        {/* Conditionally render the Start button, disable while loading */}
        {droppedFiles.length > 0 && (
          <Button onClick={handleStartClick} mt="md" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Start Splitting'}
          </Button>
        )}
        {/* Display error message if any */}
        {error && (
          <Text c="red" mt="sm">Error: {error}</Text>
        )}
        {/* Display prediction ID (or result later) */}
        {predictionResult && (
           <Text mt="sm">Prediction Started (ID: {predictionResult.id})</Text>
        )}
      </div>
    </div>
  );
}

export default Home;
