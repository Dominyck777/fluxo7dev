import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'api', 'db.json');

function readDB() {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

function writeDB(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const db = readDB();

  // GET - Listar todas as demandas
  if (req.method === 'GET') {
    return res.status(200).json(db.demands);
  }

  // POST - Criar nova demanda
  if (req.method === 'POST') {
    const newDemand = {
      ...req.body,
      id: Date.now(),
    };
    db.demands.push(newDemand);
    writeDB(db);
    return res.status(201).json(newDemand);
  }

  // PUT - Atualizar demanda
  if (req.method === 'PUT') {
    const { id } = req.query;
    const index = db.demands.findIndex((d: any) => d.id == id);
    if (index !== -1) {
      db.demands[index] = req.body;
      writeDB(db);
      return res.status(200).json(db.demands[index]);
    }
    return res.status(404).json({ error: 'Demand not found' });
  }

  // DELETE - Excluir demanda
  if (req.method === 'DELETE') {
    const { id } = req.query;
    db.demands = db.demands.filter((d: any) => d.id != id);
    writeDB(db);
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
