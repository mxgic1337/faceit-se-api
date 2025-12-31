import packageJSON from '../package.json';
import dotenv from 'dotenv';

export const FACEIT_URL_BASE_V1 = 'https://www.faceit.com/api/stats/v1';
export const FACEIT_URL_BASE_V1_MATCH = 'https://www.faceit.com/api/match/v1';
export const FACEIT_URL_BASE_V2_MATCH = 'https://www.faceit.com/api/match/v2';
export const FACEIT_URL_BASE_V4 = 'https://open.faceit.com/data/v4';

dotenv.config();

export const HEADERS = {
  'User-Agent': `${packageJSON.author}/${packageJSON.name}/${packageJSON.version} (mxgic1337.xyz)`,
  Authorization: `Bearer ${process.env.API_KEY}`,
};

export const HEADERS_NO_AUTHORIZATION = {
  'User-Agent': `${packageJSON.author}/${packageJSON.name}/${packageJSON.version} (mxgic1337.xyz)`,
};
