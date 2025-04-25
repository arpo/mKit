declare const gtag: (...args: any[]) => void; // Explicitly declare gtag
import { create } from 'zustand';
import { useDropAreaStore } from '../../components/DropArea/Script';

export interface HomeState {
  isLoading: boolean; // Tracks the overall upload & processing state
  error: string | null; // Stores errors from the upload/processing step
  processedLyrics: string | null; // Stores the final formatted lyrics from Gemini
  copyFeedback: string | null; // Stores feedback message for copy operation
  // Karaoke State
  isKaraokeOpen: boolean;
  parsedLyrics: Array<{ time: number; text: string }> | null;
  currentLyricIndex: number;

  // Actions
  uploadAndProcessAudio: (language: string) => Promise<void>; // Add language parameter
  clearResult: () => void;
  copyLyrics: () => void;
  setProcessedLyrics: (lyrics: string) => void;
  // Karaoke Actions
  toggleKaraoke: (open: boolean) => void;
  startKaraoke: () => void;
  setCurrentLyricIndex: (index: number) => void;
  _parseAndSetLyrics: () => void; // Internal helper
}

export const useHomeStore = create<HomeState>((set) => ({
  // Initial state
  isLoading: false,
  error: null,
  processedLyrics: null,
  copyFeedback: null,
  // Karaoke Initial State
  isKaraokeOpen: false,
  parsedLyrics: null,
  currentLyricIndex: -1,


  // Define actions implementations
  uploadAndProcessAudio: async (language: string) => { // Add language parameter
    // Set loading state and clear previous results/errors
    set({ isLoading: true, error: null, processedLyrics: null });

    try {
      // Get the upload function from the DropArea store
      const uploadAudio = useDropAreaStore.getState().uploadAudio;
      // Call the upload function which now returns the lyrics string, passing the language
      const lyrics = await uploadAudio(language); // Pass language

      // Success: Update state with the result
      set({ isLoading: false, processedLyrics: lyrics, error: null });
      console.log('Upload and processing successful.');

    } catch (error) {
      // Error: Update state with the error message
      console.error('[HomeStore] Error during upload/processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      set({ isLoading: false, error: errorMessage, processedLyrics: null });
      // Track processing error
      gtag('event', 'processing_error', {
        'event_category': 'Error',
        'event_label': 'Audio Processing Failed',
        'error_message': errorMessage
      });
    }
  },

  clearResult: () => {
    // Reset state and call clearFiles in DropAreaStore
    const clearDropAreaFiles = useDropAreaStore.getState().clearFiles;
    clearDropAreaFiles(); // Clear files in the DropArea store
    set({
      isLoading: false,
      error: null,
      processedLyrics: null,
      copyFeedback: null,
    });
    console.log('[HomeStore] Result cleared.');
  },

  copyLyrics: () => {
    const state = useHomeStore.getState();
    if (!state.processedLyrics) return;

    navigator.clipboard.writeText(state.processedLyrics)
      .then(() => {
        set({ copyFeedback: 'Copied to clipboard!' });
        setTimeout(() => set({ copyFeedback: null }), 2000);
        // Track lyrics copy success
        gtag('event', 'lyrics_copy', {
          'event_category': 'Conversion',
          'event_label': 'Lyrics Copied'
        });
      })
      .catch(() => {
        set({ copyFeedback: 'Failed to copy' });
        setTimeout(() => set({ copyFeedback: null }), 2000);
      });
  },

  setProcessedLyrics: (lyrics) => set({ processedLyrics: lyrics }),

  // --- Karaoke Actions Implementation ---

  toggleKaraoke: (open) => set({ isKaraokeOpen: open }),

  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),

  _parseAndSetLyrics: () => {
    const lyricsString = useHomeStore.getState().processedLyrics;
    if (!lyricsString) {
      set({ parsedLyrics: null });
      return;
    }

    const lines = lyricsString.split('\n');
    const parsed: Array<{ time: number; text: string }> = [];

    // Regex to capture [MM:SS.ms] or [HH:MM:SS] and the text
    const timestampRegex = /^\[(\d{2,}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?\]\s*(.*)/;


    lines.forEach(line => {
      const match = line.match(timestampRegex);
      if (match) {
        const hours = match[3] ? parseInt(match[1], 10) : 0;
        const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
        const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);
        const milliseconds = match[4] ? parseInt(match[4].padEnd(3, '0'), 10) : 0; // Pad ms if needed
        const text = match[5];

        const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
        parsed.push({ time: totalSeconds, text });
      }
    });

    set({ parsedLyrics: parsed });
  },

  startKaraoke: () => {
    // Ensure lyrics are parsed before opening
    useHomeStore.getState()._parseAndSetLyrics();
    // Only open if parsing was successful (or lyrics were already parsed)
    if (useHomeStore.getState().parsedLyrics && useHomeStore.getState().parsedLyrics!.length > 0) {
       set({ isKaraokeOpen: true, currentLyricIndex: -1 }); // Reset index when starting
    } else {
        console.warn("Could not parse lyrics or no timestamps found. Karaoke cannot start.");
        // Optionally set an error state here
    }
  },

}));

// Optional: Subscribe to DropAreaStore if needed for secondary effects,
// but the primary flow is initiated from HomeStore calling DropArea's upload.
/*
useDropAreaStore.subscribe(
  (state) => [state.isLoading, state.error],
  ([isLoading, error]) => {
    const homeState = useHomeStore.getState();
    // Maybe update Home's loading/error state if DropArea changes independently?
    // Careful with potential loops. Generally, HomeStore should control the overall process.
    if (isLoading !== homeState.isLoading) {
      // useHomeStore.setState({ isLoading }); // Be cautious with this
    }
    if (error && error !== homeState.error) {
      // useHomeStore.setState({ error }); // Be cautious
    }
  },
  { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
);
*/

// Helper outside create if preferred, or keep inside if using state directly is needed.
// This regex handles [MM:SS.ms] and [HH:MM:SS] formats.
/* const parseTimestamp = (timestamp: string): number => {
  const regex = /(?:(\d{2}):)?(\d{2}):(\d{2})(?:[.,](\d{1,3}))?/;
  const match = timestamp.match(regex);
  if (!match) return 0;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = match[4] ? parseInt(match[4].padEnd(3, '0'), 10) : 0;

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}; */
