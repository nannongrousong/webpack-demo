import request from 'ADMIN_UTILS/request';

export const serviceBPostData = (params) => request('/SERVICE_B/POST_DATA', params, true);

export const serviceBGetData = (params) => request('/SERVICE_B/GET_DATA', params);