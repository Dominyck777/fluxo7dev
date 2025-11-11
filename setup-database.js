import fs from 'fs';
import https from 'https';

// Configurações do JSONBin (do código analisado)
const BIN_ID = '690605e5ae596e708f3c7bc5';
const API_KEY = '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2';
const BASE_URL = 'https://api.jsonbin.io/v3';

// Função para fazer requisição HTTPS
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function setupDatabase() {
  try {
    console.log('🔄 Iniciando configuração da base de dados...');
    
    // 1. Ler estrutura da base de dados
    console.log('📖 Lendo estrutura da base de dados...');
    const databaseStructure = JSON.parse(fs.readFileSync('./database-structure.json', 'utf8'));
    
    // 2. Verificar se o bin existe
    console.log('🔍 Verificando bin existente...');
    try {
      const currentData = await makeRequest(`${BASE_URL}/b/${BIN_ID}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });
      console.log('✅ Bin encontrado. Dados atuais:', {
        devs: currentData.record.devs?.length || 0,
        projects: currentData.record.projects?.length || 0,
        demands: currentData.record.demands?.length || 0,
        transactions: currentData.record.transactions?.length || 0,
        feedbacks: currentData.record['feedback-isis']?.length || 0
      });
    } catch (error) {
      console.log('❌ Erro ao acessar bin:', error.message);
      return;
    }
    
    // 3. Fazer backup dos dados atuais
    console.log('💾 Fazendo backup dos dados atuais...');
    const backupFilename = `backup-${Date.now()}.json`;
    try {
      const currentData = await makeRequest(`${BASE_URL}/b/${BIN_ID}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });
      fs.writeFileSync(backupFilename, JSON.stringify(currentData.record, null, 2));
      console.log(`✅ Backup salvo em: ${backupFilename}`);
    } catch (error) {
      console.log('⚠️ Não foi possível fazer backup:', error.message);
    }
    
    // 4. Atualizar a base de dados
    console.log('🚀 Atualizando base de dados...');
    const updateResult = await makeRequest(`${BASE_URL}/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      }
    }, JSON.stringify(databaseStructure));
    
    console.log('✅ Base de dados atualizada com sucesso!');
    console.log('📊 Estrutura criada:');
    console.log(`   👥 Desenvolvedores: ${databaseStructure.devs.length}`);
    console.log(`   📁 Projetos: ${databaseStructure.projects.length}`);
    console.log(`   📋 Prioridades: ${databaseStructure.priorities.length}`);
    console.log(`   🎯 Demandas: ${databaseStructure.demands.length}`);
    console.log(`   💰 Transações: ${databaseStructure.transactions.length}`);
    console.log(`   ⭐ Feedbacks: ${databaseStructure['feedback-isis'].length}`);
    
    // 5. Verificar se os dados foram salvos corretamente
    console.log('🔍 Verificando dados salvos...');
    const verificationData = await makeRequest(`${BASE_URL}/b/${BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    const saved = verificationData.record;
    console.log('✅ Verificação concluída:');
    console.log(`   👥 Devs salvos: ${saved.devs?.length || 0}`);
    console.log(`   📁 Projetos salvos: ${saved.projects?.length || 0}`);
    console.log(`   🎯 Demandas salvas: ${saved.demands?.length || 0}`);
    console.log(`   💰 Transações salvas: ${saved.transactions?.length || 0}`);
    console.log(`   ⭐ Feedbacks salvos: ${saved['feedback-isis']?.length || 0}`);
    
    console.log('\n🎉 Base de dados configurada com sucesso!');
    console.log('\n📝 Credenciais de login disponíveis:');
    databaseStructure.devs.forEach(dev => {
      console.log(`   • ${dev.name}: ${dev.id} / ${dev.password} (${dev.role})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar base de dados:', error.message);
    process.exit(1);
  }
}

// Executar configuração
setupDatabase();
