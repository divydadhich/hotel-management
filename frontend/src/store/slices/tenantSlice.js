import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tenantService from '../../services/tenant.service';

export const fetchTenants = createAsyncThunk(
  'tenant/fetchTenants',
  async (params, { rejectWithValue }) => {
    try {
      const response = await tenantService.fetchTenants(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tenants');
    }
  }
);

export const createTenant = createAsyncThunk(
  'tenant/createTenant',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await tenantService.createTenant(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tenant');
    }
  }
);

export const updateTenant = createAsyncThunk(
  'tenant/updateTenant',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tenantService.updateTenant(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tenant');
    }
  }
);

export const toggleTenantStatus = createAsyncThunk(
  'tenant/toggleStatus',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tenantService.toggleStatus(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: {
    currentTenant: null,
    tenants: [],
    isLoading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  },
  reducers: {
    setCurrentTenant: (state, action) => {
      state.currentTenant = action.payload;
    },
    clearTenantError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        if (action.payload?.tenant) {
          state.tenants.unshift(action.payload.tenant);
        }
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        if (action.payload?.tenant) {
          const idx = state.tenants.findIndex((t) => t._id === action.payload.tenant._id);
          if (idx !== -1) state.tenants[idx] = action.payload.tenant;
        }
      });
  },
});

export const { setCurrentTenant, clearTenantError } = tenantSlice.actions;
export default tenantSlice.reducer;
