import { Button, Text, Stack, Anchor, SimpleGrid, Progress, Box, Alert, Paper, Loader, Select } from '@mantine/core'; // Added Select
import { IconAlertCircle } from '@tabler/icons-react'; // Removed IconInfoCircle
import DropArea from '../../components/DropArea/DropArea';
import { useDropAreaStore, DropAreaState } from '../../components/DropArea/Script'; // Still needed for droppedFiles check
import { useHomeStore, HomeState, getButtonState } from './Script'; // Import the new store, state type, and helper

function Home() {
  // Select state from the HomeStore using individual selectors
  const isLoading = useHomeStore((state: HomeState) => state.isLoading);
  const predictionId = useHomeStore((state: HomeState) => state.predictionId);
  const predictionStatus = useHomeStore((state: HomeState) => state.predictionStatus);
  const finalResult = useHomeStore((state: HomeState) => state.finalResult);
  const error = useHomeStore((state: HomeState) => state.error);
  const progress = useHomeStore((state: HomeState) => state.progress);

  // Select transcription state
  const isTranscribing = useHomeStore((state: HomeState) => state.isTranscribing);
  // const rawTranscriptionResult = useHomeStore((state: HomeState) => state.rawTranscriptionResult); // No longer needed for display
  const transcriptionError = useHomeStore((state: HomeState) => state.transcriptionError);

  // Select formatting state (New)
  const isFormatting = useHomeStore((state: HomeState) => state.isFormatting);
  const formattedTranscription = useHomeStore((state: HomeState) => state.formattedTranscription);
  const formattingError = useHomeStore((state: HomeState) => state.formattingError);


  // Select actions from the HomeStore
  const uploadAudioAndStartPolling = useHomeStore((state) => state.uploadAudioAndStartPolling);
  const clearPrediction = useHomeStore((state) => state.clearPrediction);
  const setAudioService = useHomeStore((state: HomeState) => state.setAudioService); // Get the new action

  // Select the new state for the service selection
  const selectedAudioService = useHomeStore((state: HomeState) => state.selectedAudioService);

  // Still need droppedFiles from DropArea to conditionally render buttons
  const droppedFiles = useDropAreaStore((state: DropAreaState) => state.droppedFiles);

  // Button click handlers now call actions from HomeStore
  const handleStartClick = () => uploadAudioAndStartPolling();
  const handleClearClick = () => clearPrediction();

  // Get button state using the helper function
  const buttonState = getButtonState(isLoading, predictionStatus);

  // Removed useEffect and polling logic - it's handled in Script.ts now

  return (
    <div>
      <h1>mKit</h1>
      <p>Upload your music file below:</p>
      {/* Removed parent div and LoadingOverlay */}
      <DropArea />
      {/* Add Service Selection Dropdown */}
      <Select
        label="Audio Separation Service"
        placeholder="Choose service"
        value={selectedAudioService}
        onChange={(value) => setAudioService(value as 'falai' | 'demucs')} // Cast value - 'falai' is the internal key
        data={[
          { value: 'falai', label: 'Spleeter (Replicate - Standard Split)' }, // Corrected Label
          { value: 'demucs', label: 'Demucs (Replicate - Vocal Isolation)' }, // Added Replicate for consistency
        ]}
        mt="md"
        disabled={isLoading} // Disable while processing
      />
      <Stack mt="md" gap="sm">
        {/* Conditionally render the Start/Clear button using HomeStore state */}
        {/* Show Start if files are dropped AND there's no final result/active prediction */}
        {droppedFiles.length > 0 && !finalResult && !predictionId && (
          <Button
            onClick={handleStartClick}
            loading={buttonState.loading}
            disabled={buttonState.disabled}
            color={buttonState.color}
          >
            {buttonState.text}
          </Button>
        )}
        {/* Show Clear if files are dropped OR a prediction is in progress/finished */}
        {/* Disable Clear button while the Start button is actively loading/disabled */}
        {(droppedFiles.length > 0 || predictionId) && (
          <Button onClick={handleClearClick} variant="outline" color="gray" disabled={buttonState.disabled}>
            Clear
          </Button>
        )}

        {/* Display Progress Panel when loading/processing */}
        {isLoading && predictionStatus !== 'succeeded' && predictionStatus !== 'failed' && predictionStatus !== 'canceled' && (
          <Box mt="md" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <Stack gap="xs">
              <Text fw={500}>{progress.message || 'Processing...'}</Text>
              <Progress value={progress.percentage} size="sm" animated />
              <Text size="sm" c="dimmed">
                {progress.percentage}% complete {predictionId ? `• ID: ${predictionId}` : ''}
              </Text>
              {/* Optional: Display last few log lines if helpful */}
              {/*
              <Code block>
                {progress.logs.slice(-3).join('\n')}
              </Code>
              */}
            </Stack>
          </Box>
        )}

        {/* Display Error from HomeStore */}
        {error && !isLoading && ( // Show error only when not actively loading something else
          <Text c="red" size="sm" mt="sm">Error: {error} {predictionId ? `(ID: ${predictionId})` : ''}</Text>
        )}

        {/* Display final results if available and not actively loading */}
        { finalResult && !isLoading && (
            <Box mt="md" style={{ display: 'none' }}> {/* Added display:none back */}
              <Text fw={500} mb="xs">Processing Complete:</Text>
              {/* Handle string output (Demucs vocals) */}
              {typeof finalResult === 'string' ? (
                  <Anchor href={finalResult} target="_blank">
                    Vocals (MP3)
                  </Anchor>
              /* Handle object output (Fal AI) */
              ) : typeof finalResult === 'object' && finalResult !== null ? (
                <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs">
                  {Object.entries(finalResult).map(([key, value]) => {
                    // Ensure value is a non-empty string before rendering Anchor
                    if (value && typeof value === 'string') {
                      return (
                        <Anchor href={value} target="_blank" key={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)} {/* Capitalize key */}
                        </Anchor>
                      );
                    }
                    return null; // Don't render anything if value is not a string
                  })}
                </SimpleGrid>
              ) : (
                <Text size="sm">Could not display result.</Text> // Fallback for unexpected format
              )}
              {/* Removed extra </SimpleGrid> here */}
            </Box>
        )}

        {/* Display Transcription Status/Result/Error */}
        {isTranscribing && (
          <Box mt="md" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <Stack align="center" gap="xs">
              <Loader size="sm" />
              <Text>Transcribing audio...</Text>
            </Stack>
          </Box>
        )}
        {/* Transcription Error */}
        {transcriptionError && !isTranscribing && !isFormatting && (
           <Alert icon={<IconAlertCircle size="1rem" />} title="Transcription Error" color="red" mt="md">
             {transcriptionError}
           </Alert>
        )}
        {/* Formatting Loader */}
        {isFormatting && (
          <Box mt="md" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <Stack align="center" gap="xs">
              <Loader size="sm" />
              <Text>Formatting lyrics...</Text>
            </Stack>
          </Box>
        )}
        {/* Formatting Error */}
        {formattingError && !isFormatting && (
           <Alert icon={<IconAlertCircle size="1rem" />} title="Formatting Error" color="red" mt="md">
             {formattingError}
           </Alert>
        )}
        {/* Formatted Transcription Result */}
        {formattedTranscription && !isFormatting && !formattingError && (
           <Paper shadow="xs" p="md" mt="md" withBorder>
             <Text fw={500} mb="xs">Lyrics:</Text>
             <Text style={{ whiteSpace: 'pre-wrap' }}>{formattedTranscription}</Text>
           </Paper>
        )}
        {/* End Transcription/Formatting Display */}

      </Stack>
    </div>
  );
}

export default Home;
