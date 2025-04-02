import { useEffect, useRef } from 'react';
import { Button, LoadingOverlay, Text, Stack, Anchor, SimpleGrid } from '@mantine/core';
import DropArea from '../../components/DropArea/DropArea';
import { useDropAreaStore, DropAreaState } from '../../components/DropArea/Script';

function Home() {
  // Select state individually
  const droppedFiles = useDropAreaStore((state: DropAreaState) => state.droppedFiles);
  const isLoading = useDropAreaStore((state: DropAreaState) => state.isLoading);
  const predictionId = useDropAreaStore((state: DropAreaState) => state.predictionId);
  const predictionStatus = useDropAreaStore((state: DropAreaState) => state.predictionStatus);
  const finalResult = useDropAreaStore((state: DropAreaState) => state.finalResult);
  const error = useDropAreaStore((state: DropAreaState) => state.error);

  // Select actions individually (they're stable)
  const uploadAudio = useDropAreaStore((state) => state.uploadAudio);
  const clearFiles = useDropAreaStore((state) => state.clearFiles);
  const setIsLoading = useDropAreaStore((state) => state.setIsLoading);
  const setPredictionStatus = useDropAreaStore((state) => state.setPredictionStatus);
  const setFinalResult = useDropAreaStore((state) => state.setFinalResult);
  const setError = useDropAreaStore((state) => state.setError);

  // Ref to store interval ID
  const pollingIntervalRef = useRef<number | null>(null);

  // Button click handlers
  const handleStartClick = () => uploadAudio(); // This action now sets predictionId in the store
  const handleClearClick = () => {
    clearFiles(); // This action clears state in the store
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current); // Also clear interval ref if clearing manually
      pollingIntervalRef.current = null;
    }
  };

  // useEffect for polling based on predictionId
  useEffect(() => {
    // Function to check status
    const checkStatus = async (id: string) => {
      console.log(`Checking status for ID (from component): ${id}`);
      try {
        const response = await fetch(`/api/audio-split/status/${id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        setPredictionStatus(result.status); // Update status in store

        if (result.status === 'succeeded') {
          console.log('Prediction succeeded (from component):', result);
          setFinalResult(result.output); // Update final result in store
          setIsLoading(false); // Set loading false in store
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); // Stop polling
          pollingIntervalRef.current = null;
        } else if (result.status === 'failed' || result.status === 'canceled') {
          console.error('Prediction failed/canceled (from component):', result);
          setError(result.error || `Prediction ${result.status}.`); // Update error in store
          setIsLoading(false); // Set loading false in store
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); // Stop polling
          pollingIntervalRef.current = null;
        } else {
          // Still processing, ensure loading is true
          if (!isLoading) setIsLoading(true);
        }
      } catch (error) {
        console.error('Status check fetch failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown status check error occurred.';
        setError(`Status check failed: ${errorMessage}`); // Update error in store
        setIsLoading(false); // Set loading false in store
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); // Stop polling
        pollingIntervalRef.current = null;
      }
    };

    // Start polling if we have an ID and are not yet finished/failed
    if (predictionId && predictionStatus !== 'succeeded' && predictionStatus !== 'failed' && predictionStatus !== 'canceled') {
      // Check immediately first
      checkStatus(predictionId);
      // Then set interval
      pollingIntervalRef.current = setInterval(() => {
        checkStatus(predictionId!); // Use non-null assertion as we checked predictionId
      }, 3000) as unknown as number; // Poll every 3 seconds
      console.log(`Polling started with interval ID: ${pollingIntervalRef.current}`);
    }

    // Cleanup function: clear interval when predictionId changes or component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        console.log(`Clearing interval ID: ${pollingIntervalRef.current}`);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [predictionId, predictionStatus, isLoading]); // Only depend on values needed for polling logic

  return (
    <div>
      <h1>mKit</h1>
      <p>Upload your audio file below:</p>
      {/* Wrap DropArea and Button in a relative div for LoadingOverlay */}
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <DropArea />
        <Stack mt="md" gap="sm">
          {/* Conditionally render the Start/Clear button */}
          {droppedFiles.length > 0 && !finalResult && (
            <Button onClick={handleStartClick} loading={isLoading} disabled={isLoading}>
              {isLoading ? `Status: ${predictionStatus || 'uploading'}...` : 'Start Splitting'}
            </Button>
          )}
          {(droppedFiles.length > 0 || predictionId) && !isLoading && (
             <Button onClick={handleClearClick} variant="outline" color="gray">
               Clear
             </Button>
          )}

          {/* Display Status/Error */}
          {predictionStatus && predictionStatus !== 'succeeded' && !error && !isLoading && (
            <Text size="sm">Status: {predictionStatus} (ID: {predictionId})</Text>
          )}
          {error && (
            <Text c="red" size="sm">Error: {error}</Text>
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
