import axios from 'axios';

export const BASE_URL = {
  SETTINGS: '/api/settings',
  QUALITIES: '/api/qualities',
  QUALITY_DATA: '/api/qualities/data',
  QUALITY_HIST: '/api/qualities/hist',
  MISC: '/api/misc',
  AGENTS: '/api/agents',
  PARTIES: '/api/parties',
  SIZINGS: '/api/sizings',
}

export function getApi() {
  return axios.create({});
}