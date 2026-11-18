import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    theme: 'light',
    notifications: [],
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift({ id: Date.now(), isRead: false, ...action.payload });
      if (state.notifications.length > 50) state.notifications.pop();
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    markNotificationsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  addNotification,
  removeNotification,
  markNotificationsRead,
} = uiSlice.actions;

export default uiSlice.reducer;
