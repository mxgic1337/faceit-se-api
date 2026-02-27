import packageJSON from '../package.json';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

export const faceitApiClient = axios.create({
  baseURL: 'https://open.faceit.com/data/v4',
  timeout: 5000,
  headers: {
    Authorization: `Bearer ${process.env.API_KEY}`,
    'User-Agent': `${packageJSON.author}/${packageJSON.name}/${packageJSON.version} (mxgic1337.xyz)`,
  },
});
