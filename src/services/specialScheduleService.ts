import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export type SpecialScheduleTaskPayload = {
  date: string; // YYYY-MM-DD
  description: string;
};

export type SpecialSchedule = {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  tasks: {
    _id: string;
    date: string;
    description: string;
  }[];
};

const specialScheduleApi = {
  createSpecialSchedule: async (
    startDate: string,
    endDate: string,
    tasks: SpecialScheduleTaskPayload[],
    token: string
  ): Promise<SpecialSchedule> => {
    const response = await axios.post(
      `${API_BASE_URL}/special-schedules`,
      { startDate, endDate, tasks },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Controller returns { success, data: schedule }
    return response.data?.data ?? response.data;
  },

  getSpecialSchedules: async (token: string): Promise<SpecialSchedule[]> => {
    const response = await axios.get(`${API_BASE_URL}/special-schedules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = response.data;
    if (Array.isArray(data)) return data as SpecialSchedule[];
    if (Array.isArray(data?.data)) return data.data as SpecialSchedule[];
    return [];
  },

  addTaskToSchedule: async (
    scheduleId: string,
    task: SpecialScheduleTaskPayload,
    token: string
  ): Promise<SpecialSchedule> => {
    const response = await axios.post(
      `${API_BASE_URL}/special-schedules/${scheduleId}/tasks`,
      task,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.data ?? response.data;
  },

  updateSchedule: async (
    scheduleId: string,
    payload: { startDate?: string; endDate?: string },
    token: string
  ): Promise<SpecialSchedule> => {
    const response = await axios.patch(
      `${API_BASE_URL}/special-schedules/${scheduleId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.data ?? response.data;
  },

  deleteSchedule: async (scheduleId: string, token: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/special-schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateTask: async (
    scheduleId: string,
    taskId: string,
    payload: Partial<SpecialScheduleTaskPayload>,
    token: string
  ): Promise<SpecialSchedule> => {
    const response = await axios.patch(
      `${API_BASE_URL}/special-schedules/${scheduleId}/tasks/${taskId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.data ?? response.data;
  },

  deleteTask: async (
    scheduleId: string,
    taskId: string,
    token: string
  ): Promise<SpecialSchedule> => {
    const response = await axios.delete(
      `${API_BASE_URL}/special-schedules/${scheduleId}/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data?.data ?? response.data;
  },
};

export default specialScheduleApi;
