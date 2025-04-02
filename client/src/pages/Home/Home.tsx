// Removed useEffect and useRef, using logic from Script.ts now
import { Button, LoadingOverlay, Text, Stack, Anchor, SimpleGrid } from '@mantine/core';
import DropArea from '../../components/DropArea/DropArea';
import { useDropAreaStore, DropAreaState } from '../../components/DropArea/Script'; // Still needed for droppedFiles check
import { useHomeStore, HomeState } from './Script'; // Import the new store and state type

function Home() {
  // Select state from the new HomeStore using individual selectors to avoid infinite loops
  const isLoading = useHomeStore((state: HomeState) => state.isLoading);
  const predictionId = useHomeStore((state: HomeState) => state.predictionId);
  const predictionStatus = useHomeStore((state: HomeState) => state.predictionStatus);
  const finalResult = useHomeStore((state: HomeState) => state.finalResult);
  const error = useHomeStore((state: HomeState) => state.error);

  // Select actions from the new HomeStore
  const uploadAudioAndStartPolling = useHomeStore((state) => state.uploadAudioAndStartPolling);
  const clearPrediction = useHomeStore((state) => state.clearPrediction);

  // Still need droppedFiles from DropArea to conditionally render buttons
  const droppedFiles = useDropAreaStore((state: DropAreaState) => state.droppedFiles);

  // Button click handlers now call actions from HomeStore
  const handleStartClick = () => uploadAudioAndStartPolling();
  const handleClearClick = () => clearPrediction();

  // Removed useEffect and polling logic - it's handled in Script.ts now

  return (
    <div>
      <h1>mKit</h1>
      <p>Upload your audio file below:</p>
      {/* Wrap DropArea and Button in a relative div for LoadingOverlay */}
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <DropArea />
        <Stack mt="md" gap="sm">
          {/* Conditionally render the Start/Clear button using HomeStore state */}
          {/* Show Start if files are dropped AND there's no final result yet */}
          {droppedFiles.length > 0 && !finalResult && !predictionId && (
            <Button onClick={handleStartClick} loading={isLoading} disabled={isLoading}>
              {/* Display more specific loading status based on HomeStore */}
              {isLoading && predictionStatus ? `Status: ${predictionStatus}...` : isLoading ? 'Uploading...' : 'Start Splitting'}
            </Button>
          )}
          {/* Show Clear if files are dropped OR a prediction is in progress/finished, AND not currently loading the initial upload */}
          {(droppedFiles.length > 0 || predictionId) && (
            <Button onClick={handleClearClick} variant="outline" color="gray" disabled={isLoading && !predictionId /* Disable clear during initial upload? */}>
              Clear
            </Button>
          )}

          {/* Display Status/Error from HomeStore */}
          {/* Show status text only when actively processing and not yet succeeded/failed */}
          {isLoading && predictionStatus && predictionStatus !== 'succeeded' && !error && (
            <Text size="sm">Status: {predictionStatus} (ID: {predictionId})</Text>
          )}
           {/* Show final status if not loading and prediction exists */}
           {!isLoading && predictionStatus && predictionStatus !== 'succeeded' && predictionId && !error &&(
             <Text size="sm">Status: {predictionStatus} (ID: {predictionId})</Text>
           )}
          {error && (
            <Text c="red" size="sm">Error: {error} {predictionId ? `(ID: ${predictionId})` : ''}</Text>
          )}

          {/* Display final results if available */}
          {finalResult && (
            <div>
              <Text fw={500} mb="xs">Splitting Complete:</Text>
              <SimpleGrid cols={2} spacing="xs">
                {/* Add type check for finalResult before mapping */}
                {finalResult && typeof finalResult === 'object' ? Object.entries(finalResult).map(([key, value]) => {
                  // Ensure value is a non-empty string before rendering Anchor
                  if (value && typeof value === 'string') {
                    return (
                      <Anchor href={value} target="_blank" key={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} {/* Capitalize key */}
                      </Anchor>
                    );
                  }
                  return null; // Don't render anything if value is not a string
                }) : <Text size="sm">Processing result...</Text>}
              </SimpleGrid>
            </div>
          )}
        </Stack>
      </div>
    </div>
  );
}

export default Home;
