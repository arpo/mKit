// Remove useState import as it's no longer needed for drag state
import { Group, Text, useMantineTheme, ActionIcon } from '@mantine/core'; // Removed rem
import { useWindowEvent } from '@mantine/hooks'; // Import useWindowEvent
import { IconUpload, IconFileMusic, IconX, IconTrash } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useDropAreaStore, DropAreaState, DropAreaActions } from './Script'; // Import store, state, and actions
import { useHomeStore } from '../../pages/Home/Script'; // Import useHomeStore
import './DropArea.css'; // Import the CSS file

interface DropAreaProps extends Partial<DropzoneProps> {
  onNewFileDropped?: () => void;
}

import { useEffect } from 'react';

function DropArea({ onNewFileDropped, ...props }: DropAreaProps) {
  const setOnNewFileDropped = useDropAreaStore(state => state.setOnNewFileDropped);

  useEffect(() => {
    // Set callback when component mounts
    setOnNewFileDropped(onNewFileDropped || null);
    
    // Clean up when component unmounts
    return () => {
      setOnNewFileDropped(null);
    };
  }, [onNewFileDropped, setOnNewFileDropped]);
  const theme = useMantineTheme();
  // Get state and actions from the Zustand store
  const isDraggingOverWindow = useDropAreaStore((state: DropAreaState) => state.isDraggingOverWindow);
  const droppedFiles = useDropAreaStore((state: DropAreaState) => state.droppedFiles); // Get dropped files state
  // Select actions using the hook
  const setDragging = useDropAreaStore((state: DropAreaActions) => state.setDragging);
  const handleFileDrop = useDropAreaStore((state: DropAreaActions) => state.handleFileDrop);
  const handleFileReject = useDropAreaStore((state: DropAreaActions) => state.handleFileReject);

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
      multiple={false} // Allow only one file
      {...props}
      // Keep dynamic styles inline, move static ones to CSS
      className="dropAreaRoot" // Apply root class
      style={{
        position: 'relative', // Add position relative for absolute positioning of clear button
        border: isDraggingOverWindow ? `2px dashed ${theme.colors.blue[6]}` : `1px solid ${theme.colors.gray[7]}`, // Dynamic border remains inline
        borderRadius: theme.radius.sm, // Dynamic borderRadius remains inline (could be moved if static)
        transition: 'border-color 0.1s ease-in-out, height 0.3s ease-in-out, min-height 0.3s ease-in-out', // Dynamic transition remains inline
        overflow: 'hidden', // Dynamic overflow remains inline
      }}
    >
      {/* Conditionally render clear button */}
      {droppedFiles.length > 0 && (
        <ActionIcon
          onClick={(event) => { // Accept event object
            event.stopPropagation(); // Stop event propagation
            useHomeStore.getState().clearResult(); // Call clearResult from HomeStore
          }}
          variant="subtle"
          color="gray"
          aria-label="Clear dropped file"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} // Position in top right corner
        >
          <IconTrash size={16} />
        </ActionIcon>
      )}

      {/* Conditionally render content based on whether files are dropped */}
      {droppedFiles.length > 0 ? (
        <div className="droppedFileWrapper"> {/* Apply wrapper class */}
          {/* Use style prop for dynamic color, className for static size */}
          <IconFileMusic
            className="dropAreaIcon" // Apply icon class
            style={{ color: String(theme.colors.dimmed) }} // Dynamic color remains inline
            stroke={1.5}
          />
          <Text size="lg" mt="sm">File(s) dropped:</Text>
          <Text size="sm" c="dimmed">
            {droppedFiles.map(file => file.name).join(', ')}
          </Text>
          {/* Optionally add a button/icon here to clear the files */}
        </div>
      ) : (
        <Group justify="center" gap="xl" className="dropAreaInnerGroup"> {/* Apply inner group class */}
          <Dropzone.Accept>
            <IconUpload
              className="dropAreaIcon" // Apply icon class
              style={{ color: String(theme.colors.blue[6]) }} // Dynamic color remains inline
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              className="dropAreaIcon" // Apply icon class
              style={{ color: String(theme.colors.red[6]) }} // Dynamic color remains inline
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileMusic
              className="dropAreaIcon" // Apply icon class
              style={{ color: String(theme.colors.dimmed) }} // Dynamic color remains inline
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag a music file here or click to select
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach audio files, max 300MB per file
            </Text>
          </div>
        </Group>
      )}
    </Dropzone>
  );
}

export default DropArea;
