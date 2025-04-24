import { Button, Text, Stack, Alert, Paper, Loader, Box, ActionIcon, Textarea, TextInput, Group } from '@mantine/core'; // Removed unused imports like Progress, Select, Anchor, SimpleGrid
import { IconAlertCircle, IconCopy, IconX, IconTrash } from '@tabler/icons-react';
import DropArea from '../../components/DropArea/DropArea';
import { useDropAreaStore } from '../../components/DropArea/Script'; // Keep for droppedFiles check and audioUrl
import { useHomeStore } from './Script'; // Import the simplified store

function Home() {
  // Select state from the simplified HomeStore
  const isLoading = useHomeStore((state) => state.isLoading);
  const error = useHomeStore((state) => state.error);
  const processedLyrics = useHomeStore((state) => state.processedLyrics);
  const copyFeedback = useHomeStore((state) => state.copyFeedback);

  // Select actions from the simplified HomeStore
  const uploadAndProcessAudio = useHomeStore((state) => state.uploadAndProcessAudio);
  const clearResult = useHomeStore((state) => state.clearResult);

  // Get droppedFiles and audioUrl from DropArea
  const droppedFiles = useDropAreaStore((state) => state.droppedFiles);
  const audioUrl = useDropAreaStore((state) => state.audioUrl);

  // Button click handlers
  const handleStartClick = () => uploadAndProcessAudio();
  const handleClearClick = () => clearResult();

  // Determine button state based on simplified logic
  const canStart = droppedFiles.length > 0 && !isLoading && !processedLyrics;
  const showClear = droppedFiles.length > 0 || isLoading || processedLyrics || error;

  return (
    <div>
      <h1 style={{fontSize: '50px'}}>mKit</h1>
      <p>Drop your audio file below to get the lyrics:</p>

      <DropArea onNewFileDropped={clearResult} />

      {/* Conditionally render audio player */}
      {audioUrl && (
        <Box mt="md">
          <audio controls src={audioUrl} style={{ width: '100%' }}>
            Your browser does not support the audio element.
          </audio>
        </Box>
      )}

      <Stack mt="md" gap="sm">
        {/* Show Start button and Language input only if files are ready and not loading/processed */}
        {canStart && (
          <Box display="flex" style={{ gap: 'var(--mantine-spacing-sm)' }}> {/* Use Box with flex display and style for gap */}
            <Button
              onClick={handleStartClick}
              loading={isLoading} // Use isLoading directly
              disabled={isLoading}
              w="50%" // Fixed width
            >
              Get Lyrics
            </Button>
            <TextInput
              placeholder="Language (auto detect)"
              w="50%" // Fixed width
            />
          </Box>
        )}

        {/* Display Loading state */}
        {isLoading && (
           <Box mt="md" p="sm" style={{ border: '0px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
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
           <Paper shadow="xs" p="md" mt="md" withBorder style={{ position: 'relative' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text fw={500}></Text>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 {copyFeedback && (
                   <Text size="sm" c="dimmed">
                     {copyFeedback}
                   </Text>
                 )}
                 <ActionIcon
                   variant="subtle"
                   onClick={() => useHomeStore.getState().copyLyrics()}
                   aria-label="Copy lyrics"
                 >
                   <IconCopy size={16} />
                 </ActionIcon>
               </div>
             </div>
             {/* Replace Text with Textarea for editable lyrics */}
             <Textarea
               value={processedLyrics}
               onChange={(e) => useHomeStore.getState().setProcessedLyrics(e.currentTarget.value)}
               autosize
               minRows={3}
               maxRows={10}
               styles={{
                 input: {
                  textAlign: 'center',
                   whiteSpace: 'pre-wrap',
                   padding: 0,
                   border: 'none',
                   backgroundColor: 'transparent'
                 }
               }}
               mt="xs"
               autoFocus
             />
           </Paper>
        )}
      </Stack>
    </div>
  );
}

export default Home;
