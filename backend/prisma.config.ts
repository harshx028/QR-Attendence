import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: `file:${path.join(__dirname, 'prisma', 'dev.db')}`,
  },
});
