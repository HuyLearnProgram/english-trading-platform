// src/apis/googleCalendar.ts
import axiosInstance from '@utils/axios';

export const apiGcalStatus = () =>
  axiosInstance({ url: '/integrations/google/calendar/status', method: 'get' });

export const apiGcalAuthUrl = () =>
  axiosInstance({ url: '/integrations/google/calendar/auth-url', method: 'get' });

export const apiGcalSync = () =>
  axiosInstance({ 
    url: '/integrations/google/calendar/sync', 
    method: 'post',
    timeout: 600000, // 60s
   });
