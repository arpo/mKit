import React from 'react';
import { Button, Text, Stack, Alert, Paper, Loader, Box } from '@mantine/core'; // Removed unused imports like Progress, Select, Anchor, SimpleGrid
import { IconAlertCircle } from '@tabler/icons-react';
import DropArea from '../../components/DropArea/DropArea';
import { useDropAreaStore } from '../../components/DropArea/Script'; // Keep for droppedFiles check
import { useHomeStore } from './Script'; // Import the simplified store

function Home() {
  // Select state from the simplified HomeStore
  const isLoading = useHomeStore((state) => state.isLoading);
  const error = useHomeStore((state) => state.error);
  const processedLyrics = useHomeStore((state) => state.processedLyrics);

  // Select actions from the simplified HomeStore
  const uploadAndProcessAudio = useHomeStore((state) => state.uploadAndProcessAudio);
  const clearResult = useHomeStore((state) => state.clearResult);

  // Get droppedFiles from DropArea to enable/disable buttons
  const droppedFiles = useDropAreaStore((state) => state.droppedFiles);

  // Button click handlers
  const handleStartClick = () => uploadAndProcessAudio();
  const handleClearClick = () => clearResult();

  // Determine button state based on simplified logic
  const canStart = droppedFiles.length > 0 && !isLoading && !processedLyrics;
  const showClear = droppedFiles.length > 0 || isLoading || processedLyrics || error;

  return (
    <div>
      <h1>mKit - Audio to Lyrics</h1>
      <p>Drop your audio file below to get the lyrics:</p>

      <DropArea />

      <Stack mt="md" gap="sm">
        {/* Show Start button only if files are ready and not loading/processed */}
        {canStart && (
          <Button
            onClick={handleStartClick}
            loading={isLoading} // Use isLoading directly
            disabled={isLoading}
          >
            Get Lyrics
          </Button>
        )}

        {/* Show Clear button if there are files, loading, result, or error */}
        {showClear && (
          <Button
            onClick={handleClearClick}
            variant="outline"
            color="gray"
            disabled={isLoading && !error} // Allow clearing error even if technically loading stopped due to error
          >
            Clear
          </Button>
        )}

        {/* Display Loading state */}
        {isLoading && (
           <Box mt="md" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <Stack align="center" gap="xs">
              <Loader size="sm" />
              <Text>Processing audio...</Text>
            </Stack>
          </Box>
        )}

        {/* Display Error */}
        {error && !isLoading && ( // Show error only when not actively loading
          <Alert icon={<IconAlertCircle size="1rem" />} title="Processing Error" color="red" mt="md">
            {error}
          </Alert>
        )}

        {/* Display Processed Lyrics */}
        {processedLyrics && !isLoading && !error && (
           <Paper shadow="xs" p="md" mt="md" withBorder>
             <Text fw={500} mb="xs">Lyrics:</Text>
             {/* Use pre-wrap to preserve line breaks from Gemini */}
             <Text style={{ whiteSpace: 'pre-wrap' }}>{processedLyrics}</Text>
           </Paper>
        )}
      </Stack>
    </div>
  );
}

export default Home;
