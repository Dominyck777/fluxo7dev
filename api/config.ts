import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data para desenvolvimento - em produção usar banco de dados real
const mockDB = {
  devs: ["Dominyck", "Kallew", "Talison"],
  projects: ["F7 Arena", "F7 Barber"],
  priorities: ["Baixa", "Média", "Alta", "Urgente"]
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  return res.status(200).json({
    devs: mockDB.devs,
    projects: mockDB.projects,
    priorities: mockDB.priorities,
  });
}
