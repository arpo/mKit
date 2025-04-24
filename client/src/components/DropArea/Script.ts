import { create } from 'zustand';

// Define the state shape for the DropArea component
export interface DropAreaState {
  isDraggingOverWindow: boolean;
  droppedFiles: File[];
  audioUrl: string | null; // URL for the dropped audio file
  isLoading: boolean; // Tracks the direct upload and transcription process
  // predictionId: string | null; // REMOVED
  // predictionStatus: string | null; // REMOVED
  // finalResult: any | null; // REMOVED - Result (lyrics) managed by HomeStore
  error: string | null; // For storing upload/processing errors
  onNewFileDropped: (() => void) | null; // Callback for new file drops
}

// Define actions for the DropArea component
export interface DropAreaActions {
  setDragging: (dragging: boolean) => void;
  handleFileDrop: (files: File[]) => void;
  handleFileReject: (rejections: any[]) => void;
  // Return the lyrics string or throw error
  uploadAudio: (language: string) => Promise<string>; // Updated function signature to accept language
  clearFiles: () => void;
  // Add simple setters for state management
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  revokeAudioUrl: () => void; // Action to revoke the current audio URL
  setOnNewFileDropped: (callback: (() => void) | null) => void;
  // setPredictionStatus: (status: string | null) => void; // REMOVED
  // setFinalResult: (result: any | null) => void; // REMOVED
  // setPredictionId: (id: string | null) => void; // REMOVED
}

// Combine state and actions
type FullDropAreaState = DropAreaState & DropAreaActions;

export const useDropAreaStore = create<FullDropAreaState>((set, get) => ({
  // Initial state - include all properties from DropAreaState
  isDraggingOverWindow: false,
  droppedFiles: [],
  audioUrl: null, // Initialize audioUrl
  isLoading: false, // Initialize isLoading
  // predictionId: null, // REMOVED
  // predictionStatus: null, // REMOVED
  // finalResult: null, // REMOVED
  error: null, // Initialize error
  onNewFileDropped: null as (() => void) | null,
  // pollingIntervalId: null, // REMOVED

  // Define actions implementations
  setDragging: (dragging) => set({ isDraggingOverWindow: dragging }),

  revokeAudioUrl: () => {
    const currentUrl = get().audioUrl;
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      console.log('Revoked audio URL:', currentUrl);
    }
    set({ audioUrl: null });
  },

  handleFileDrop: (files) => {
    console.log('Accepted files (from Script.ts):', files);
    const { revokeAudioUrl } = get(); // Get the revoke action

    // Call onNewFileDropped callback if provided
    const { onNewFileDropped } = get();
    if (onNewFileDropped) {
      onNewFileDropped();
    }

    // Revoke any existing URL before creating a new one
    revokeAudioUrl();

    let newAudioUrl: string | null = null;
    if (files.length > 0 && files[0].type.startsWith('audio/')) {
      newAudioUrl = URL.createObjectURL(files[0]);
      console.log('Created audio URL:', newAudioUrl);
    }

    // Reset relevant state on new file drop
    set({
      droppedFiles: files,
      audioUrl: newAudioUrl, // Set the new URL
      isDraggingOverWindow: false,
      isLoading: false, // Ensure loading is reset
      error: null, // Clear previous errors
      // predictionId: null, // REMOVED
      // predictionStatus: null, // REMOVED
      // finalResult: null, // REMOVED
    });
  },

  handleFileReject: (rejections) => {
    console.error('Rejected files (from Script.ts):', rejections);
    // Handle rejection state
    set({
      isDraggingOverWindow: false,
      error: 'File rejected (check size or type).', // Provide clearer error
      droppedFiles: [], // Clear files on rejection
      isLoading: false, // Ensure loading is false
      // predictionId: null, // REMOVED
      // predictionStatus: 'failed', // REMOVED
      // finalResult: null, // REMOVED
    });
  },

  clearFiles: () => {
    const { revokeAudioUrl } = get(); // Get the revoke action
    revokeAudioUrl(); // Revoke URL on clear

    // Clear files and associated state
    set({
      droppedFiles: [],
      audioUrl: null, // Ensure URL is cleared in state
      isLoading: false, // Reset loading state
      error: null, // Clear any errors
      // predictionId: null, // REMOVED
      // predictionStatus: null, // REMOVED
      // finalResult: null, // REMOVED
    });
  },

  // uploadAudio now directly interacts with the backend /api/gemini endpoint
  uploadAudio: async (language: string): Promise<string> => { // Accept language parameter
    const { droppedFiles } = get(); // Get files from state
    if (droppedFiles.length === 0) {
      const errorMsg = 'No file selected.';
      console.error(errorMsg);
      set({ error: errorMsg, isLoading: false }); // Set error state
      throw new Error(errorMsg);
    }

    // Start loading, clear previous errors
    set({ isLoading: true, error: null });

    const file = droppedFiles[0];
    const formData = new FormData();
    // Key 'audioFile' must match the backend Multer setup
    formData.append('audioFile', file);
    // Append the language to the form data
    formData.append('language', language);

    try {
      const url = '/api/gemini'; // Target the backend endpoint
      console.log(`[Upload] Sending audio file to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // No 'Content-Type' header needed for FormData with fetch
      });

      const result = await response.json(); // Parse JSON response

      if (!response.ok) {
        // Throw an error with the message from the backend, or a generic one
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

       // Check if lyrics string is present in the response
       if (typeof result.lyrics !== 'string') {
           console.error('[Upload] Invalid response structure:', result);
           throw new Error('Received invalid response format from server.');
       }

      console.log('Gemini transcription successful.');
      // Set loading false on success, but don't store lyrics here. Let HomeStore handle it.
      set({ isLoading: false, error: null });
      return result.lyrics; // Return the lyrics string

    } catch (error) {
      console.error('[Upload] Direct transcription failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown upload error occurred.';
      // Set error state and re-throw
      set({ error: errorMessage, isLoading: false });
      throw error; // Rethrow for the caller (HomeStore) to handle
    }
  },

  // --- Simple Setters ---
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setOnNewFileDropped: (callback) => set({ onNewFileDropped: callback }),
  // setPredictionStatus: (status) => set({ predictionStatus: status }), // REMOVED
  // setFinalResult: (result) => set({ finalResult: result }), // REMOVED
  // setPredictionId: (id) => set({ predictionId: id }), // REMOVED

}));

// Optional: Export helper functions related to DropArea logic (if any)
// export function someHelperFunction() { ... }
