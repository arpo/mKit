declare const gtag: (...args: any[]) => void; // Explicitly declare gtag
import { useState } from 'react'; // Import useState
import { ActionIcon, Alert, Box, Button, Loader, Paper, Stack, Text, Textarea, TextInput } from '@mantine/core'; // Removed unused imports like Progress, Select, Anchor, SimpleGrid
import { IconAlertCircle, IconCopy, IconMusic } from '@tabler/icons-react'; // Added IconMusic
import DropArea from '../../components/DropArea/DropArea';
import { useDropAreaStore } from '../../components/DropArea/Script'; // Keep for droppedFiles check and audioUrl
import './Home.css'; // Import the CSS for responsive styling
import { useHomeStore } from './Script'; // Import the simplified store
import Karaoke from '../../components/Karaoke/Karaoke'; // Import Karaoke component

function Home() {
  // State for the language input
  const [language, setLanguage] = useState('');

  // Select state from the simplified HomeStore
  const isLoading = useHomeStore((state) => state.isLoading);
  const error = useHomeStore((state) => state.error);
  const processedLyrics = useHomeStore((state) => state.processedLyrics);
  const copyFeedback = useHomeStore((state) => state.copyFeedback);

  // Select actions from the simplified HomeStore
  const uploadAndProcessAudio = useHomeStore((state) => state.uploadAndProcessAudio);
  const clearResult = useHomeStore((state) => state.clearResult);
  const startKaraoke = useHomeStore((state) => state.startKaraoke); // Added Karaoke action

  // Get droppedFiles and audioUrl from DropArea
  const droppedFiles = useDropAreaStore((state) => state.droppedFiles);
  const audioUrl = useDropAreaStore((state) => state.audioUrl);

  // Button click handlers
  const handleStartClick = () => {
    // Track button click with Google Analytics
    gtag('event', 'button_click', {
      'event_category': 'Engagement',
      'event_label': 'Get Lyrics Button',
      'language': language // Add language parameter
    });
    uploadAndProcessAudio(language); // Pass language
  };

  // Determine button state based on simplified logic
  const canStart = droppedFiles.length > 0 && !isLoading && !processedLyrics;

  return (
    <div>
      <h1 style={{fontSize: '50px', marginBottom: 0}}>mKit</h1>
      <p>Drop your audio file below to get the lyrics:</p>

      <DropArea onNewFileDropped={clearResult} />

      {/* Conditionally render audio player */}
      {audioUrl && (
        <Box mt="md">
          <audio
            controls
            src={audioUrl}
            style={{ width: '100%' }}
            onPlay={() => { // Add onPlay handler
              gtag('event', 'audio_playback', {
                'event_category': 'Media',
                'event_label': 'Audio Play Started'
              });
            }}
          >
            Your browser does not support the audio element.
          </audio>
        </Box>
      )}

      <Stack mt="md" gap="sm">
        {/* Show Start button and Language input only if files are ready and not loading/processed */}
        {canStart && (
          <Box
            display="flex"
            style={{ gap: 'var(--mantine-spacing-sm)' }}
            className="responsive-controls"
          >
            <Button
              onClick={handleStartClick}
              loading={isLoading}
              disabled={isLoading}
              className="responsive-button"
            >
              Get Lyrics
            </Button>
            <TextInput
              placeholder="Language (auto detect)"
              className="responsive-input"
              value={language} // Bind value
              onChange={(event) => setLanguage(event.currentTarget.value)} // Add onChange handler
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
                 {/* Karaoke Button */}
                 <ActionIcon
                   variant="subtle"
                   onClick={() => startKaraoke()}
                   disabled={!audioUrl || !processedLyrics} // Enable only when audio and lyrics are present
                   aria-label="Start Karaoke"
                   title="Start Karaoke" // Tooltip
                 >
                   <IconMusic size={16} />
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

      {/* Render Karaoke Modal (conditionally rendered internally based on isKaraokeOpen) */}
      <Karaoke />
    </div>
  );
}

export default Home;
