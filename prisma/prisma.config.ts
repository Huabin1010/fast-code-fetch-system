import 'dotenv/config';

import path from 'node:path';
import type { PrismaConfig } from 'prisma';

export default {
  schema: path.join('models'),
} satisfies PrismaConfig;
