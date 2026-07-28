import axios from 'axios';

export async function getDataloom(config?: { url?: string; method?: string; data?: unknown }): Promise<any> {
  if (!config) return {};
  const response = await axios(config);
  return response.data;
}
export default getDataloom;
