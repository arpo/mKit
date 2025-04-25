import { useEffect, useRef, createRef, useState } from 'react'; // Import useState
import { Modal, Box, Text, ScrollArea } from '@mantine/core';
import { useHomeStore } from '../../pages/Home/Script';
import { useDropAreaStore } from '../DropArea/Script';
import { setupAudioListener, scrollToLyric, LyricLine } from './Script';
import './Karaoke.css';

function Karaoke() {
  // State and actions from HomeStore
  const isKaraokeOpen = useHomeStore((state) => state.isKaraokeOpen);
  const parsedLyrics = useHomeStore((state) => state.parsedLyrics);
  const currentLyricIndex = useHomeStore((state) => state.currentLyricIndex);
  const toggleKaraoke = useHomeStore((state) => state.toggleKaraoke);
  const setCurrentLyricIndex = useHomeStore((state) => state.setCurrentLyricIndex);

  // Audio URL from DropAreaStore
  const audioUrl = useDropAreaStore((state) => state.audioUrl);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null); // Keep ref to store the node
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [isAudioElementSet, setIsAudioElementSet] = useState(false); // State to track ref assignment

  // Callback ref function
  const audioElementCallbackRef = (node: HTMLAudioElement | null) => {
      if (node && !audioRef.current) { // Only act when first assigned
          // console.log("[Karaoke Ref Callback] Audio element mounted."); // Removed log
          audioRef.current = node;
          setIsAudioElementSet(true); // Trigger state update
      } else if (!node && audioRef.current) { // When unmounting
           // console.log("[Karaoke Ref Callback] Audio element unmounted."); // Removed log
           audioRef.current = null;
           setIsAudioElementSet(false);
      }
  };

  // Create refs for each lyric line to enable scrolling
  const lyricLineRefs = useRef<React.RefObject<HTMLParagraphElement>[]>([]);

  // Ensure refs array has the correct size when lyrics change
  if (parsedLyrics && lyricLineRefs.current.length !== parsedLyrics.length) {
    lyricLineRefs.current = Array(parsedLyrics.length).fill(null).map((_, i) => lyricLineRefs.current[i] || createRef<HTMLParagraphElement>());
  }

  // Effect to manage the audio listener lifecycle
  useEffect(() => {
    // console.log(`[Karaoke Effect] Running. isKaraokeOpen: ${isKaraokeOpen}, isAudioElementSet: ${isAudioElementSet}, parsedLyrics: ${!!parsedLyrics?.length}`); // Removed log

    const audioElement = audioRef.current; // Use the ref populated by the callback
    let timeUpdateCleanup: (() => void) | null = null; // To store the cleanup function for timeupdate

    // Define the handler for when metadata is loaded
    const handleMetadataLoaded = () => {
      // console.log("[Karaoke Effect] handleMetadataLoaded triggered."); // Removed log
      if (audioElement && parsedLyrics && parsedLyrics.length > 0) {
        // console.log("[Karaoke Effect] Conditions met in handleMetadataLoaded, setting up timeupdate listener..."); // Removed log
        setCurrentLyricIndex(-1); // Reset index
        timeUpdateCleanup = setupAudioListener(
          audioElement,
          parsedLyrics,
          setCurrentLyricIndex
        );
        // console.log("[Karaoke Effect] setupAudioListener returned cleanup:", timeUpdateCleanup); // Removed log
      } else {
         // console.log("[Karaoke Effect] Conditions NOT met in handleMetadataLoaded."); // Removed log
      }
    };

    // Condition now includes isAudioElementSet
    if (isKaraokeOpen && isAudioElementSet && audioElement && parsedLyrics && parsedLyrics.length > 0) {
      // console.log("[Karaoke Effect] Conditions met (incl. isAudioElementSet), setting up metadata listener..."); // Removed log

      // Check if metadata is already loaded (readyState >= 1 means HAVE_METADATA)
      if (audioElement.readyState >= 1) {
        // console.log("[Karaoke Effect] Metadata already loaded, calling handler directly."); // Removed log
        handleMetadataLoaded();
      } else {
         // console.log("[Karaoke Effect] Metadata not loaded yet, attaching loadedmetadata listener."); // Removed log
        audioElement.addEventListener('loadedmetadata', handleMetadataLoaded);
      }

      // Return cleanup function for the main effect
      return () => {
        // console.log("[Karaoke Effect] Main cleanup running."); // Removed log
        // Remove the metadata listener if it was attached
        audioElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
        // console.log("[Karaoke Effect] Removed loadedmetadata listener."); // Removed log
        // Call the timeupdate cleanup function IF it was created
        if (timeUpdateCleanup) {
          // console.log("[Karaoke Effect] Calling timeUpdate cleanup."); // Removed log
          timeUpdateCleanup();
        }
        // Pause audio on close
        if (audioElement) {
          audioElement.pause();
        }
      };
    } else if (!isKaraokeOpen) {
      // Condition: Modal is closed
      // console.log("[Karaoke Effect] Modal closed, ensuring index is reset."); // Removed log
      setCurrentLyricIndex(-1); // Ensure index is reset
    } else {
      // Condition: Modal is open, but audio element not set or lyrics missing/empty
      // console.log(`[Karaoke Effect] Conditions NOT met. isAudioElementSet: ${isAudioElementSet}, audioElement exists: ${!!audioElement}, parsedLyrics count: ${parsedLyrics?.length || 0}`); // Removed log
    }

    // Explicitly return undefined if no cleanup needed for this path
    return undefined;

  }, [isKaraokeOpen, parsedLyrics, isAudioElementSet, setCurrentLyricIndex]); // Depend on isAudioElementSet


   // Effect to scroll the current lyric into view
   useEffect(() => {
     // Add explicit null check for lyricsContainerRef.current
     if (isKaraokeOpen && currentLyricIndex >= 0 && lyricLineRefs.current[currentLyricIndex] && lyricsContainerRef.current) {
       scrollToLyric(lyricsContainerRef, lyricLineRefs.current[currentLyricIndex]);
     }
   }, [currentLyricIndex, isKaraokeOpen]); // Dependency on index and open state

  return (
    <Modal
      opened={isKaraokeOpen}
      onClose={() => toggleKaraoke(false)}
      title="Karaoke Mode"
      size="lg" // Adjust size as needed
      centered // Center modal
    >
      {audioUrl && (
        <Box mb="md">
          <audio
            ref={audioElementCallbackRef} // Use the callback ref here
            controls
            src={audioUrl}
            style={{ width: '100%' }}
            // Optional: Add event tracking if needed
            // onPlay={() => console.log('Karaoke audio playing')}
            // onPause={() => console.log('Karaoke audio paused')}
          >
            Your browser does not support the audio element.
          </audio>
        </Box>
      )}

      <ScrollArea style={{ height: 300 }} viewportRef={lyricsContainerRef}>
        <Box className="lyrics-container">
          {parsedLyrics && parsedLyrics.length > 0 ? (
            parsedLyrics.map((lyric: LyricLine, index: number) => (
              <Text
                key={`${lyric.time}-${index}`} // Use time and index for key
                ref={lyricLineRefs.current[index]} // Assign ref to each line
                className={index === currentLyricIndex ? 'current-lyric' : ''}
                // p="xs" // Add padding if needed via Mantine prop
              >
                {lyric.text || '\u00A0'} {/* Render non-breaking space if text is empty */}
              </Text>
            ))
          ) : (
            <Text c="dimmed" ta="center">No lyrics loaded or parsed correctly.</Text>
          )}
        </Box>
      </ScrollArea>
    </Modal>
  );
}

export default Karaoke;
