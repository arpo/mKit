import { create } from 'zustand';

// Define the state shape for the DropArea component
export interface DropAreaState {
  isDraggingOverWindow: boolean;
  droppedFiles: File[]; // State to hold dropped files
  isLoading: boolean; // For upload status
  predictionResult: any | null; // To store result/ID from backend
  error: string | null; // To store upload error message
}

// Define actions for the DropArea component
export interface DropAreaActions {
  setDragging: (dragging: boolean) => void;
  handleFileDrop: (files: File[]) => void;
  handleFileReject: (rejections: any[]) => void; // Consider using FileRejection[] type if available/needed
  uploadAudio: () => Promise<void>; // Action to trigger upload
  clearFiles: () => void; // Action to clear dropped files (useful later)
  // Example actions:
  // setFiles: (files: File[]) => void;
  // uploadFiles: () => Promise<void>;
}

// Combine state and actions
type FullDropAreaState = DropAreaState & DropAreaActions;

export const useDropAreaStore = create<FullDropAreaState>((set, get) => ({
  // Initial state - include all properties from DropAreaState
  isDraggingOverWindow: false,
  droppedFiles: [],
  isLoading: false,
  predictionResult: null,
  error: null,

  // Define actions implementations
  setDragging: (dragging) => set({ isDraggingOverWindow: dragging }),

  handleFileDrop: (files) => {
    console.log('Accepted files (from Script.ts):', files);
    set({
      droppedFiles: files, // Store the dropped files
      isDraggingOverWindow: false, // Reset drag state on drop
      predictionResult: null, // Clear previous results on new drop
      error: null, // Clear previous errors on new drop
      isLoading: false, // Ensure loading is false
    });
  },

  handleFileReject: (rejections) => {
    console.error('Rejected files (from Script.ts):', rejections);
    set({
      isDraggingOverWindow: false,
      error: 'File rejected (check size or type).', // Provide clearer error
      droppedFiles: [], // Clear files on rejection
      predictionResult: null,
      isLoading: false,
     });
  },

  clearFiles: () => set({
    droppedFiles: [],
    predictionResult: null,
    error: null,
    isLoading: false,
  }),

  uploadAudio: async () => {
    const files = get().droppedFiles;
    if (files.length === 0) {
      console.error('No file selected for upload.');
      set({ error: 'No file selected.' });
      return;
    }

    set({ isLoading: true, error: null, predictionResult: null }); // Start loading, clear errors/results

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
      set({ predictionResult: result, isLoading: false });
      // Client-side polling for result status would start here, using result.id

    } catch (error) {
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown upload error occurred.';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));

// Optional: Export helper functions related to DropArea logic
// export function initDropArea() {
//   // Perform any one-time setup for the drop area logic if needed
//   console.log('DropArea script initialized');
// }
