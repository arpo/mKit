import { useState } from 'react'; // Import useState
import { Group, Text, rem, useMantineTheme } from '@mantine/core';
import { useWindowEvent } from '@mantine/hooks'; // Import useWindowEvent
import { IconUpload, IconFileMusic, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
// import { useDropAreaStore } from './Script'; // Uncomment when store is used

function DropArea(props: Partial<DropzoneProps>) {
  const theme = useMantineTheme();
  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState(false);
  // const { someState, someAction } = useDropAreaStore(); // Example state access

  // Window event listeners
  useWindowEvent('dragenter', () => {
    setIsDraggingOverWindow(true);
  });

  useWindowEvent('dragleave', (event) => {
    // Check if the mouse left the viewport
    if (
      event.clientY <= 0 ||
      event.clientX <= 0 ||
      event.clientX >= window.innerWidth ||
      event.clientY >= window.innerHeight
    ) {
      setIsDraggingOverWindow(false);
    }
  });

  useWindowEvent('drop', () => {
    setIsDraggingOverWindow(false);
  });


  const handleDrop = (files: File[]) => {
    setIsDraggingOverWindow(false); // Ensure border is removed on drop
    console.log('Accepted files:', files);
    // Placeholder: Add logic to handle files, e.g., update state via Script.ts
    // someAction.setFiles(files);
  };

  const handleReject = (fileRejections: any[]) => {
    setIsDraggingOverWindow(false); // Ensure border is removed on rejection
    console.error('Rejected files:', fileRejections);
    // Placeholder: Add logic for rejected files if needed
  };

  return (
    <Dropzone
      onDrop={handleDrop}
      onReject={handleReject}
      maxSize={100 * 1024 ** 2} // 100MB limit
      accept={['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/mp3']} // Define accepted audio types directly
      {...props}
      style={{
        minHeight: rem(120),
        pointerEvents: 'all',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: isDraggingOverWindow ? `2px dashed ${theme.colors.blue[6]}` : 'none', // Conditional border
        transition: 'border 0.1s ease-in-out', // Smooth transition
      }}
    >
      <Group justify="center" gap="xl" style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload
            style={{ width: rem(52), height: rem(52), color: String(theme.colors.blue[6]) }} // Explicitly cast
            stroke={1.5}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            style={{ width: rem(52), height: rem(52), color: String(theme.colors.red[6]) }} // Explicitly cast
            stroke={1.5}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFileMusic
            style={{ width: rem(52), height: rem(52), color: String(theme.colors.dimmed) }} // Explicitly cast
            stroke={1.5}
          />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Drag audio files here or click to select files
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            Attach audio files, max 100MB per file
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}

export default DropArea;
