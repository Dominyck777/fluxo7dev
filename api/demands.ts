import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data para desenvolvimento - em produção usar banco de dados real
const mockDB = {
  devs: ["Dominyck", "Kallew", "Talison"],
  projects: ["F7 Arena", "F7 Barber"],
  priorities: ["Baixa", "Média", "Alta", "Urgente"],
  demands: []
};

function readDB() {
  // Em produção, conectar com banco de dados real (MongoDB, PostgreSQL, etc.)
  return mockDB;
}

function writeDB(data: any) {
  // Em produção, salvar no banco de dados real
  Object.assign(mockDB, data);
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
