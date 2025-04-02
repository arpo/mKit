import { create } from 'zustand';

// Define the state shape for the DropArea component
export interface DropAreaState {
  isDraggingOverWindow: boolean;
  droppedFiles: File[];
  isLoading: boolean; // Tracks initial upload + potentially polling status
  predictionId: string | null; // Store only the ID after initial request
  predictionStatus: string | null; // e.g., 'starting', 'processing', 'succeeded', 'failed'
  finalResult: any | null; // Store final output from Replicate
  error: string | null;
  // pollingIntervalId: number | null; // REMOVED - Polling managed by component
}

// Define actions for the DropArea component
export interface DropAreaActions {
  setDragging: (dragging: boolean) => void;
  handleFileDrop: (files: File[]) => void;
  handleFileReject: (rejections: any[]) => void;
  uploadAudio: () => Promise<void>;
  clearFiles: () => void;
  // Add simple setters to be called from component effects
  setIsLoading: (loading: boolean) => void;
  setPredictionStatus: (status: string | null) => void;
  setFinalResult: (result: any | null) => void;
  setError: (error: string | null) => void;
  setPredictionId: (id: string | null) => void; // Added to ensure ID can be set/cleared
  // REMOVED Polling actions: _startPolling, _stopPolling, _checkStatus
}

// Combine state and actions
type FullDropAreaState = DropAreaState & DropAreaActions;

export const useDropAreaStore = create<FullDropAreaState>((set, get) => ({
  // Initial state - include all properties from DropAreaState
  isDraggingOverWindow: false,
  droppedFiles: [],
  isLoading: false,
  predictionId: null,
  predictionStatus: null,
  finalResult: null,
  error: null,
  // pollingIntervalId: null, // REMOVED

  // Define actions implementations
  setDragging: (dragging) => set({ isDraggingOverWindow: dragging }),

  handleFileDrop: (files) => {
    console.log('Accepted files (from Script.ts):', files);
    // Don't need to stop polling here anymore
    set({
      droppedFiles: files, // Store the dropped files
      isDraggingOverWindow: false, // Reset drag state on drop
      predictionId: null, // Clear previous ID
      predictionStatus: null, // Clear previous status
      finalResult: null, // Clear previous results
      error: null, // Clear previous errors on new drop
      isLoading: false, // Ensure loading is false
    });
  },

  handleFileReject: (rejections) => {
    console.error('Rejected files (from Script.ts):', rejections);
    // Don't need to stop polling here anymore
    set({
      isDraggingOverWindow: false,
      error: 'File rejected (check size or type).', // Provide clearer error
      droppedFiles: [], // Clear files on rejection
      predictionId: null,
      predictionStatus: 'failed',
      finalResult: null,
      isLoading: false,
     });
  },

  clearFiles: () => {
    // Don't need to stop polling here anymore
    set({
      droppedFiles: [],
      predictionId: null,
      predictionStatus: null,
      finalResult: null,
      error: null,
      isLoading: false,
      // pollingIntervalId: null // REMOVED
    });
  },

  uploadAudio: async () => {
    const files = get().droppedFiles;
    if (files.length === 0) {
      console.error('No file selected for upload.');
      set({ error: 'No file selected.' });
      return;
    }
    // Don't need to stop polling here anymore
    // Start loading, clear previous results/errors
    set({ isLoading: true, error: null, predictionId: null, predictionStatus: 'uploading', finalResult: null });

    const file = files[0]; // Assuming single file upload for now
    const formData = new FormData();
    formData.append('audio', file); // Key must match upload.single('audio') in routes.ts

    try {
      const response = await fetch('/api/audio-split', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Throw error with message from backend if available
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Upload successful, prediction started:', result);
      // Only store ID and initial status. Keep loading true. Polling handled by component.
      set({ predictionId: result.id, predictionStatus: result.status || 'starting', isLoading: true });
      // REMOVED: get()._startPolling(result.id);

    } catch (error) {
      console.error('File upload failed:', error);
      // Don't need to stop polling here anymore
      const errorMessage = error instanceof Error ? error.message : 'An unknown upload error occurred.';
      set({ error: errorMessage, isLoading: false, predictionStatus: 'failed' });
    }
  },

  // --- Simple Setters ---
  setIsLoading: (loading) => set({ isLoading: loading }),
  setPredictionStatus: (status) => set({ predictionStatus: status }),
  setFinalResult: (result) => set({ finalResult: result }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setPredictionId: (id) => set({ predictionId: id }),

  // REMOVED Polling actions: _startPolling, _stopPolling, _checkStatus

}));

// Optional: Export helper functions related to DropArea logic
// export function initDropArea() {
//   // Perform any one-time setup for the drop area logic if needed
//   console.log('DropArea script initialized');
// }
