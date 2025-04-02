// Remove useState import as it's no longer needed for drag state
import { Group, Text, rem, useMantineTheme } from '@mantine/core';
import { useWindowEvent } from '@mantine/hooks'; // Import useWindowEvent
import { IconUpload, IconFileMusic, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useDropAreaStore, DropAreaState, DropAreaActions } from './Script'; // Import store, state, and actions

function DropArea(props: Partial<DropzoneProps>) {
  const theme = useMantineTheme();
  // Get state and actions from the Zustand store
  const isDraggingOverWindow = useDropAreaStore((state: DropAreaState) => state.isDraggingOverWindow);
  const { setDragging, handleFileDrop, handleFileReject } = useDropAreaStore.getState();

  // Window event listeners updated to use store action
  useWindowEvent('dragenter', () => {
    setDragging(true);
  });

  useWindowEvent('dragleave', (event) => {
    // Check if the mouse left the viewport and update store
    if (
      event.clientY <= 0 ||
      event.clientX <= 0 ||
      event.clientX >= window.innerWidth ||
      event.clientY >= window.innerHeight
    ) {
      setDragging(false);
    }
  });

  useWindowEvent('drop', () => {
    setDragging(false); // Also reset on drop via window event
  });

  // handleDrop and handleReject are now directly passed from the store

  return (
    <Dropzone
      onDrop={handleFileDrop} // Use action from store
      onReject={handleFileReject} // Use action from store
      maxSize={100 * 1024 ** 2} // 100MB limit
      accept={['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/mp3']} // Define accepted audio types directly
      {...props}
      style={{
        minHeight: rem(120),
        pointerEvents: 'all',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: isDraggingOverWindow ? `2px dashed ${theme.colors.blue[6]}` : `1px solid ${theme.colors.gray[7]}`, // Conditional dashed border, default solid border
        borderRadius: theme.radius.sm, // Add some rounding
        transition: 'border-color 0.1s ease-in-out', // Smooth transition for color change
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
