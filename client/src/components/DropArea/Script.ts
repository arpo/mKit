import { create } from 'zustand';

// Define the state shape for the DropArea component
export interface DropAreaState {
  isDraggingOverWindow: boolean;
  // Example state: Store dropped files?
  // droppedFiles: File[];
  // isLoading: boolean;
}

// Define actions for the DropArea component
export interface DropAreaActions {
  setDragging: (dragging: boolean) => void;
  handleFileDrop: (files: File[]) => void;
  handleFileReject: (rejections: any[]) => void; // Consider using FileRejection[] type if available/needed
  // Example actions:
  // setFiles: (files: File[]) => void;
  // clearFiles: () => void;
  // uploadFiles: () => Promise<void>;
}

// Combine state and actions
type FullDropAreaState = DropAreaState & DropAreaActions;

export const useDropAreaStore = create<FullDropAreaState>((set) => ({
  // Initial state
  isDraggingOverWindow: false,
  // droppedFiles: [],
  // isLoading: false,

  // Define actions implementations
  setDragging: (dragging) => set({ isDraggingOverWindow: dragging }),

  handleFileDrop: (files) => {
    console.log('Accepted files (from Script.ts):', files);
    set({ isDraggingOverWindow: false }); // Reset drag state on drop
    // Add logic to store files in state if needed:
    // set({ droppedFiles: files, isDraggingOverWindow: false });
  },

  handleFileReject: (rejections) => {
    console.error('Rejected files (from Script.ts):', rejections);
    set({ isDraggingOverWindow: false }); // Reset drag state on rejection
    // Add logic for handling rejections if needed
  },

  // setFiles: (files) => set({ droppedFiles: files }),
  // clearFiles: () => set({ droppedFiles: [] }),
  // uploadFiles: async () => {
  //   set({ isLoading: true });
  //   const files = get().droppedFiles;
  //   try {
  //     // ... upload logic using 'files' ...
  //     console.log('Uploading files:', files);
  //     // On success:
  //     // set({ isLoading: false, droppedFiles: [] }); // Clear files on success?
  //   } catch (error) {
  //     console.error('File upload failed:', error);
  //     set({ isLoading: false });
  //   }
  // },
}));

// Optional: Export helper functions related to DropArea logic
// export function initDropArea() {
//   // Perform any one-time setup for the drop area logic if needed
//   console.log('DropArea script initialized');
// }
