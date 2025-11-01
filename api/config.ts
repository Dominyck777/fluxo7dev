import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'api', 'db.json');

function readDB() {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = readDB();
  
  return res.status(200).json({
    devs: db.devs,
    projects: db.projects,
    priorities: db.priorities,
  });
}
