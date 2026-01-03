import axios from 'axios';

// API base URL - matches the backend route in src/index.js
const API_BASE_URL = 'http://localhost:5000/api';

// Mock data for development
const getMockTimeSlots = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  return [
    {
      id: '1',
      startTime: '09:00',
      endTime: '10:00',
      description: 'Team Meeting',
      completed: false
    },
    {
      id: '2',
      startTime: '10:30',
      endTime: '11:30',
      description: 'Code Review',
      completed: false
    },
    {
      id: '3',
      startTime: '13:00',
      endTime: '14:00',
      description: 'Lunch Break',
      completed: false
    },
    {
      id: '4',
      startTime: '14:30',
      endTime: '16:00',
      description: 'Feature Development',
      completed: true
    }
  ];
};

const timetableApi = {
  getDailySchedule: async (date: string, token: string) => {
    try {
      console.log(`Fetching schedule for date: ${date}`);
      const response = await axios.get(`${API_BASE_URL}/timetable/${date}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log('Schedule API Response:', response);
      
      // Handle different response structures
      let timeSlots = [];
      if (response.data && response.data.timeSlots) {
        timeSlots = response.data.timeSlots;
      } else if (Array.isArray(response.data)) {
        timeSlots = response.data; // Direct array response
      } else if (response.data && response.data.data) {
        timeSlots = response.data.data; // Nested data property
      }
      
      // If no time slots found, use mock data in development
      if (timeSlots.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No time slots found, using mock data for development');
        return getMockTimeSlots();
      }
      
      return timeSlots;
    } catch (error: any) {
      console.error('Error in getDailySchedule:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // In development, return mock data if there's an error
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data due to error');
        return getMockTimeSlots();
      }
      
      throw error;
    }
  },

  updateDailySchedule: async (date: string, timeSlots: any[], token: string) => {
    try {
      console.log('Sending update request with:', { date, timeSlots });
      const response = await axios.put(
        `${API_BASE_URL}/timetable/${date}`,
        { timeSlots },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      console.log('Update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      throw error;
    }
  },

  getSchedulesInRange: async (startDate: string, endDate: string, token: string) => {
    const response = await axios.get(`${API_BASE_URL}/timetable`, {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateTimeSlotStatus: async (date: string, slotId: string, status: string, token: string) => {
    console.log('Updating time slot status:', { date, slotId, status });
    
    // First, get the current schedule
    const currentDate = new Date().toISOString().split('T')[0];
    const data = await timetableApi.getDailySchedule(currentDate, token);
    
    // Handle different response formats
    let slots = [];
    if (Array.isArray(data)) {
      slots = data;
    } else if (data && Array.isArray(data.timeSlots)) {
      slots = data.timeSlots;
    } else if (data && data.data && Array.isArray(data.data)) {
      slots = data.data;
    }
    
    // Find and update the slot
    const updatedSlots = slots.map(slot => {
      if (slot.id === slotId || slot._id === slotId) {
        return { ...slot, status };
      }
      return slot;
    });
    
    // Update the schedule with the updated slots
    const response = await axios.put(
      `${API_BASE_URL}/timetable/${currentDate}`,
      { timeSlots: updatedSlots },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log('Update status response:', response.data);
    return response.data;
  },

  deleteTimeSlot: async (date: string, slotId: string, token: string) => {
    try {
      console.log('Deleting time slot:', { date, slotId });
      
      // First, get the current schedule
      const currentDate = new Date().toISOString().split('T')[0];
      const data = await timetableApi.getDailySchedule(currentDate, token);
      
      // Handle different response formats
      let slots = [];
      if (Array.isArray(data)) {
        slots = data;
      } else if (data && Array.isArray(data.timeSlots)) {
        slots = data.timeSlots;
      } else if (data && data.data && Array.isArray(data.data)) {
        slots = data.data;
      }
      
      console.log('All slots before deletion:', slots);
      
      // Filter out the slot to be deleted
      const updatedSlots = slots.filter(slot => {
        const isMatch = String(slot.id) === String(slotId) || String(slot._id) === String(slotId);
        if (isMatch) {
          console.log('Removing slot:', slot);
          return false; // Don't keep this slot
        }
        return true; // Keep other slots
      });
      
      console.log('Slots after deletion:', updatedSlots);
      
      // Always save to the backend, even in development mode
      console.log('Saving updated slots to backend:', updatedSlots);
      
      try {
        const response = await axios.put(
          `${API_BASE_URL}/timetable/${currentDate}`,
          { timeSlots: updatedSlots },
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log('Backend save successful:', response.data);
        
        // Return the updated slots from the response or use our local updatedSlots
        return response.data?.timeSlots || response.data?.data || updatedSlots;
      } catch (error) {
        console.error('Error saving to backend:', error);
        // Even if the backend save fails, return the updated slots to update the UI
        return updatedSlots;
      }
    } catch (error: any) {
      console.error('Error deleting time slot:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      throw error;
    }
  },

  updateTimeSlot: async (date: string, slotId: string, updatedSlot: any, token: string) => {
    try {
      console.log('Updating time slot:', { date, slotId, updatedSlot });
      
      // First, get the current schedule
      const currentDate = new Date().toISOString().split('T')[0];
      const data = await timetableApi.getDailySchedule(currentDate, token);
      
      // Handle different response formats
      let slots = [];
      if (Array.isArray(data)) {
        slots = data;
      } else if (data && Array.isArray(data.timeSlots)) {
        slots = data.timeSlots;
      } else if (data && data.data && Array.isArray(data.data)) {
        slots = data.data;
      }
      
      console.log('All slots:', slots);
      console.log('Looking for slot with ID:', slotId);
      
      // Find the index of the slot to update
      const slotIndex = slots.findIndex(slot => {
        const idMatch = slot.id === slotId || slot._id === slotId;
        if (idMatch) {
          console.log('Found matching slot:', slot);
        }
        return idMatch;
      });
      
      if (slotIndex === -1) {
        console.error('Time slot not found. Available slots:', slots);
        throw new Error(`Time slot with ID ${slotId} not found`);
      }
      
      // Update the slot
      const updatedSlots = [...slots];
      const originalSlot = updatedSlots[slotIndex];
      
      updatedSlots[slotIndex] = { 
        ...originalSlot,
        ...updatedSlot,
        // Preserve the original IDs
        id: originalSlot.id || originalSlot._id || slotId,
        _id: originalSlot._id || originalSlot.id || slotId
      };
      
      console.log('Updated slots array:', updatedSlots);
      
      // Update the schedule with the updated slots
      const response = await axios.put(
        `${API_BASE_URL}/timetable/${currentDate}`,
        { timeSlots: updatedSlots },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Update API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting time slot:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      throw error;
    }
  }
};

export default timetableApi;
