import fs from 'fs';
import https from 'https';

const BIN_ID = '690605e5ae596e708f3c7bc5';
const API_KEY = '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2';

// Função para fazer requisições HTTPS
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Analisar logs do roteador
function analyzeRouterLogs(logContent) {
  console.log('🔍 Analisando logs do roteador...\n');
  
  const lines = logContent.split('\n');
  const jsonbinRequests = [];
  
  lines.forEach((line, index) => {
    // Procurar por requisições para jsonbin.io
    if (line.includes('jsonbin.io') || line.includes('api.jsonbin.io')) {
      jsonbinRequests.push({
        lineNumber: index + 1,
        content: line.trim(),
        timestamp: extractTimestamp(line),
        type: extractRequestType(line)
      });
    }
  });
  
  console.log(`📊 Encontradas ${jsonbinRequests.length} requisições para JSONBin:`);
  console.log('');
  
  jsonbinRequests.forEach((req, index) => {
    console.log(`${index + 1}. Linha ${req.lineNumber}:`);
    console.log(`   Timestamp: ${req.timestamp || 'Não identificado'}`);
    console.log(`   Tipo: ${req.type || 'Não identificado'}`);
    console.log(`   Log: ${req.content}`);
    console.log('');
  });
  
  return jsonbinRequests;
}

// Extrair timestamp do log
function extractTimestamp(logLine) {
  // Padrões comuns de timestamp em logs
  const patterns = [
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,  // 2024-11-11 14:30:25
    /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/, // 11/11/2024 14:30:25
    /(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/,     // Nov 11 14:30:25
    /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/    // 11-11-2024 14:30:25
  ];
  
  for (const pattern of patterns) {
    const match = logLine.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Extrair tipo de requisição
function extractRequestType(logLine) {
  const line = logLine.toUpperCase();
  
  if (line.includes('GET')) return 'GET (Leitura)';
  if (line.includes('PUT')) return 'PUT (Escrita)';
  if (line.includes('POST')) return 'POST (Criação)';
  if (line.includes('DELETE')) return 'DELETE (Exclusão)';
  
  return 'Desconhecido';
}

// Tentar recuperar dados de timestamps específicos
async function tryRecoverFromTimestamp(timestamp) {
  console.log(`🔄 Tentando recuperar dados do timestamp: ${timestamp}`);
  
  try {
    // Infelizmente, o JSONBin não permite buscar por timestamp específico
    // Mas podemos tentar as versões disponíveis
    const versionsUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}/versions`;
    
    const response = await makeRequest(versionsUrl, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    if (response && Array.isArray(response)) {
      console.log(`✅ Encontradas ${response.length} versões no JSONBin`);
      
      // Procurar versão mais próxima do timestamp
      const targetTime = new Date(timestamp).getTime();
      let closestVersion = null;
      let smallestDiff = Infinity;
      
      response.forEach(version => {
        const versionTime = new Date(version.createdAt).getTime();
        const diff = Math.abs(targetTime - versionTime);
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestVersion = version;
        }
      });
      
      if (closestVersion) {
        console.log(`🎯 Versão mais próxima: ${closestVersion.versionId}`);
        console.log(`   Data: ${new Date(closestVersion.createdAt).toLocaleString('pt-BR')}`);
        
        // Recuperar dados dessa versão
        const versionData = await makeRequest(
          `https://api.jsonbin.io/v3/b/${BIN_ID}/${closestVersion.versionId}`,
          {
            method: 'GET',
            headers: {
              'X-Master-Key': API_KEY
            }
          }
        );
        
        if (versionData && versionData.record) {
          const data = versionData.record;
          console.log('📊 Dados recuperados:');
          console.log(`   👥 Desenvolvedores: ${data.devs?.length || 0}`);
          console.log(`   📁 Projetos: ${data.projects?.length || 0}`);
          console.log(`   📋 Demandas: ${data.demands?.length || 0}`);
          console.log(`   💰 Transações: ${data.transactions?.length || 0}`);
          
          // Salvar dados recuperados
          const filename = `recovered-${closestVersion.versionId}-${Date.now()}.json`;
          fs.writeFileSync(filename, JSON.stringify(data, null, 2));
          console.log(`💾 Dados salvos em: ${filename}`);
          
          return data;
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro ao recuperar dados: ${error.message}`);
  }
  
  return null;
}

// Função principal
async function main() {
  console.log('🌐 ANALISADOR DE LOGS DO ROTEADOR - Fluxo7 Dev\n');
  
  // Verificar se foi fornecido um arquivo de log
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 INSTRUÇÕES DE USO:\n');
    console.log('1. 🌐 ACESSE SEU ROTEADOR:');
    console.log('   - Digite no navegador: 192.168.1.1 ou 192.168.0.1');
    console.log('   - Faça login (geralmente admin/admin)');
    console.log('');
    console.log('2. 📊 ENCONTRE OS LOGS:');
    console.log('   - Procure por "Logs", "System Logs" ou "Traffic Monitor"');
    console.log('   - Exporte ou copie os logs para um arquivo .txt');
    console.log('');
    console.log('3. 🔍 EXECUTE A ANÁLISE:');
    console.log('   - node analyze-router-logs.js meus-logs.txt');
    console.log('');
    console.log('4. 🎯 O QUE PROCURAR NOS LOGS:');
    console.log('   - Requisições para: jsonbin.io');
    console.log('   - Requisições para: api.jsonbin.io');
    console.log('   - GET requests (leitura de dados)');
    console.log('   - PUT requests (escrita de dados)');
    console.log('');
    console.log('💡 DICA: Se não conseguir acessar o roteador, tente também:');
    console.log('   - Verificar histórico do navegador (Ctrl+H)');
    console.log('   - Procurar em Downloads por arquivos JSON');
    console.log('   - Verificar lixeira do computador');
    console.log('');
    
    // Tentar listar versões disponíveis no JSONBin
    console.log('🔄 Verificando versões disponíveis no JSONBin...\n');
    
    try {
      const versionsUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}/versions`;
      const response = await makeRequest(versionsUrl, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });
      
      if (response && Array.isArray(response)) {
        console.log(`✅ Encontradas ${response.length} versões no JSONBin:`);
        console.log('');
        
        // Mostrar as últimas 10 versões
        const recentVersions = response.slice(0, 10);
        recentVersions.forEach((version, index) => {
          const date = new Date(version.createdAt).toLocaleString('pt-BR');
          console.log(`   ${index + 1}. ${version.versionId} - ${date}`);
        });
        
        console.log('');
        console.log('💡 Para recuperar uma versão específica:');
        console.log('   node analyze-router-logs.js --version VERSAO_ID');
        
      } else {
        console.log('❌ Não foi possível acessar as versões do JSONBin');
      }
      
    } catch (error) {
      console.log(`❌ Erro ao verificar versões: ${error.message}`);
    }
    
    return;
  }
  
  // Se foi especificada uma versão específica
  if (args[0] === '--version' && args[1]) {
    const versionId = args[1];
    console.log(`🔄 Recuperando versão específica: ${versionId}\n`);
    
    try {
      const versionData = await makeRequest(
        `https://api.jsonbin.io/v3/b/${BIN_ID}/${versionId}`,
        {
          method: 'GET',
          headers: {
            'X-Master-Key': API_KEY
          }
        }
      );
      
      if (versionData && versionData.record) {
        const data = versionData.record;
        console.log('✅ Dados recuperados com sucesso!');
        console.log('📊 Conteúdo:');
        console.log(`   👥 Desenvolvedores: ${data.devs?.length || 0}`);
        console.log(`   📁 Projetos: ${data.projects?.length || 0}`);
        console.log(`   📋 Demandas: ${data.demands?.length || 0}`);
        console.log(`   💰 Transações: ${data.transactions?.length || 0}`);
        console.log(`   ⭐ Feedbacks: ${data['feedback-isis']?.length || 0}`);
        
        // Salvar dados
        const filename = `recovered-version-${versionId}-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`\n💾 Dados salvos em: ${filename}`);
        
        console.log('\n🚀 Para restaurar estes dados:');
        console.log(`   node restore-from-backup.js ${filename}`);
        
      } else {
        console.log('❌ Versão não encontrada ou sem dados');
      }
      
    } catch (error) {
      console.log(`❌ Erro ao recuperar versão: ${error.message}`);
    }
    
    return;
  }
  
  // Analisar arquivo de log fornecido
  const logFile = args[0];
  
  if (!fs.existsSync(logFile)) {
    console.log(`❌ Arquivo não encontrado: ${logFile}`);
    return;
  }
  
  console.log(`📂 Analisando arquivo: ${logFile}\n`);
  
  try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const requests = analyzeRouterLogs(logContent);
    
    if (requests.length > 0) {
      console.log('🎯 PRÓXIMOS PASSOS:');
      console.log('');
      console.log('1. Identifique o timestamp da última requisição GET bem-sucedida');
      console.log('2. Execute: node analyze-router-logs.js --recover "TIMESTAMP"');
      console.log('');
      console.log('Exemplo de timestamp: "2024-11-11 14:30:25"');
    } else {
      console.log('😞 Nenhuma requisição para JSONBin encontrada nos logs.');
      console.log('');
      console.log('💡 OUTRAS OPÇÕES:');
      console.log('   - Verificar outros arquivos de log do roteador');
      console.log('   - Procurar logs de firewall ou proxy');
      console.log('   - Verificar cache do navegador');
    }
    
  } catch (error) {
    console.log(`❌ Erro ao ler arquivo: ${error.message}`);
  }
}

// Executar
main().catch(console.error);
