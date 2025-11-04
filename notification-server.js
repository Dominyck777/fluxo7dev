const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.post('/notify', (req, res) => {
  const { message, user } = req.body;
  
  console.log(`📢 Enviando notificação para ${user}: ${message}`);
  
  // Caminho para o script PowerShell
  const scriptPath = path.join(__dirname, 'notify.ps1');
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Message "${message}" -User "${user}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar PowerShell: ${error}`);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        fallback: `Notificação simulada para ${user}: ${message}`
      });
    }
    
    console.log(`✅ PowerShell executado com sucesso para ${user}`);
    console.log('stdout:', stdout);
    
    if (stderr) {
      console.log('stderr:', stderr);
    }
    
    res.json({ 
      success: true, 
      message: `Notificação enviada para ${user}`,
      output: stdout
    });
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor de notificações ativo' });
});

app.listen(PORT, () => {
  console.log(`🔔 Servidor de notificações rodando na porta ${PORT}`);
  console.log(`📝 Endpoint: http://localhost:${PORT}/notify`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});
