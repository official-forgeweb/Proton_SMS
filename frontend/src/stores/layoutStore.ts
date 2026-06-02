import { create } from 'zustand';

interface LayoutState {
    isSidebarOpen: boolean; // Tracks if mobile drawer is slide-open
    isSidebarCollapsed: boolean; // Tracks if desktop/tablet sidebar is collapsed to 70px icon mode
    toggleSidebar: () => void;
    toggleSidebarCollapse: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    isSidebarOpen: false,
    isSidebarCollapsed: false, // Default to expanded on desktop

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}));
