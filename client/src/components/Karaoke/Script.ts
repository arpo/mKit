import { RefObject } from 'react';

export interface LyricLine {
  time: number;
  text: string;
}

// Function to set up the timeupdate listener
export const setupAudioListener = (
  audioElement: HTMLAudioElement,
  parsedLyrics: LyricLine[] | null,
  setCurrentLyricIndex: (index: number) => void
): (() => void) => { // Returns a cleanup function
  // console.log("[Karaoke Listener] setupAudioListener called."); // Removed log
  if (!parsedLyrics || parsedLyrics.length === 0) {
    // console.log("[Karaoke Listener] No parsed lyrics, exiting setup."); // Removed log
    // No lyrics or empty lyrics, return a no-op cleanup
    return () => {};
  }

  let lastFoundIndex = -1; // Keep track of the last index to avoid unnecessary updates

  const handleTimeUpdate = () => {
    const currentTime = audioElement.currentTime;
    // console.log(currentTime); // Removed user-added log
    let currentLyricIndex = -1; // Default to -1 (no lyric active yet)
    // console.log(`[Karaoke Listener] Time: ${currentTime.toFixed(3)}`); // Removed verbose log

    // Find the index of the latest lyric whose time is less than or equal to the current time
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (parsedLyrics[i].time <= currentTime) {
        currentLyricIndex = i;
        break; // Found the latest applicable lyric
      }
    }

    // Only call the state update function if the index has actually changed
    if (currentLyricIndex !== lastFoundIndex) {
      // console.log(`[Karaoke Listener] Index changing: ${lastFoundIndex} -> ${currentLyricIndex} (Audio Time: ${currentTime.toFixed(3)}, Lyric Time: ${parsedLyrics ? parsedLyrics[currentLyricIndex]?.time.toFixed(3) : 'N/A'})`); // Removed log
      setCurrentLyricIndex(currentLyricIndex);
      lastFoundIndex = currentLyricIndex; // Update the last found index
    }
  };

  // Add the event listener
  // console.log("[Karaoke Listener] Attempting to attach listener..."); // Removed log
  audioElement.addEventListener('timeupdate', handleTimeUpdate);
  // console.log("[Karaoke Listener] Listener attached."); // Removed log

  // Return the cleanup function
  return () => {
    // console.log("[Karaoke Listener] Attempting to remove listener..."); // Removed log
    audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    // console.log("[Karaoke Listener] Listener removed."); // Removed log
  };
};

// Helper function to scroll the current lyric into view (optional but good UX)
// Updated to accept potentially null containerRef
export const scrollToLyric = (containerRef: RefObject<HTMLDivElement | null>, lyricRef: RefObject<HTMLParagraphElement>) => {
    // Check both refs .current properties are non-null
    if (containerRef.current && lyricRef.current) {
        const container = containerRef.current;
        const lyricElement = lyricRef.current;

        const containerRect = container.getBoundingClientRect();
        const lyricRect = lyricElement.getBoundingClientRect();

        // Calculate desired scroll position (center the lyric if possible)
        const desiredScrollTop = lyricElement.offsetTop - container.offsetTop - (containerRect.height / 2) + (lyricRect.height / 2);

        container.scrollTo({
            top: desiredScrollTop,
            behavior: 'smooth'
        });
    }
};
