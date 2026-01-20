import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  tracksPath: process.env.TRACKS_PATH || join(__dirname, '../../tracks'),
  cachePath: process.env.CACHE_PATH || join(__dirname, '../../cache/album-art'),
  frontendDistPath: join(__dirname, '../../../frontend/dist'),
  dataPath: process.env.DATA_PATH || join(__dirname, '../../data'),
  privatePasswordHash: process.env.PRIVATE_PASSWORD_HASH,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  jwtSecret: process.env.JWT_SECRET || 'default-dev-secret-change-me',
};
