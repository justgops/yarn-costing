import axios from 'axios';

export const BASE_URL = {
  SETTINGS: '/api/settings',
  QUALITIES: '/api/qualities',
  MISC: '/api/misc',
}

export function getApi() {
  return axios.create({});
}