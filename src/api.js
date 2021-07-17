import axios from 'axios';

export const BASE_URL = {
  SETTINGS: '/api/settings',
  QUALITIES: '/api/qualities',
  QUALITY_DATA: '/api/qualities/data',
  MISC: '/api/misc',
  AGENTS: '/api/agents',
  PARTIES: '/api/parties',
}

export function getApi() {
  return axios.create({});
}