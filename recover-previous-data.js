import https from 'https';

const BIN_ID = '690605e5ae596e708f3c7bc5';
const API_KEY = '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2';
const BASE_URL = 'https://api.jsonbin.io/v3';

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

async function recoverPreviousData() {
  try {
    console.log('🔍 Tentando recuperar dados anteriores...\n');
    
    // 1. Verificar versões disponíveis
    console.log('📋 Verificando versões disponíveis no JSONBin...');
    try {
      const versionsResponse = await makeRequest(`${BASE_URL}/b/${BIN_ID}/versions`, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });
      
      console.log('✅ Versões encontradas:', versionsResponse.length);
      
      // Listar as últimas 5 versões
      const recentVersions = versionsResponse.slice(0, 5);
      console.log('\n📅 Últimas versões:');
      recentVersions.forEach((version, index) => {
        const date = new Date(version.createdAt).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ${version.versionId} - ${date}`);
      });
      
      // Tentar recuperar a penúltima versão (antes da última alteração)
      if (recentVersions.length >= 2) {
        const previousVersion = recentVersions[1]; // Segunda mais recente
        console.log(`\n🔄 Recuperando versão: ${previousVersion.versionId}`);
        
        const versionData = await makeRequest(`${BASE_URL}/b/${BIN_ID}/${previousVersion.versionId}`, {
          method: 'GET',
          headers: {
            'X-Master-Key': API_KEY
          }
        });
        
        const data = versionData.record;
        
        console.log('\n📊 Dados encontrados na versão anterior:');
        console.log(`   👥 Desenvolvedores: ${data.devs?.length || 0}`);
        console.log(`   📁 Projetos: ${data.projects?.length || 0}`);
        console.log(`   🎯 Demandas: ${data.demands?.length || 0}`);
        console.log(`   💰 Transações: ${data.transactions?.length || 0}`);
        console.log(`   ⭐ Feedbacks: ${data['feedback-isis']?.length || 0}`);
        
        // Salvar backup da versão anterior
        const fs = await import('fs');
        const backupFilename = `recovered-data-${Date.now()}.json`;
        fs.writeFileSync(backupFilename, JSON.stringify(data, null, 2));
        console.log(`\n💾 Dados salvos em: ${backupFilename}`);
        
        // Perguntar se quer restaurar
        console.log('\n❓ Para restaurar estes dados, execute:');
        console.log(`   node restore-from-backup.js ${backupFilename}`);
        
        return data;
      } else {
        console.log('⚠️ Não há versões anteriores suficientes disponíveis.');
      }
      
    } catch (error) {
      console.log('❌ Erro ao acessar versões:', error.message);
    }
    
    // 2. Tentar recuperar do cache local (se existir)
    console.log('\n🔍 Verificando possíveis caches locais...');
    
    // Verificar se há arquivos temporários
    const fs = await import('fs');
    const files = fs.readdirSync('.');
    const tempFiles = files.filter(f => 
      f.includes('temp') || 
      f.includes('cache') || 
      f.includes('backup') ||
      f.startsWith('.')
    );
    
    if (tempFiles.length > 0) {
      console.log('📁 Arquivos temporários encontrados:');
      tempFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
    
    // 3. Sugestões adicionais
    console.log('\n💡 OUTRAS OPÇÕES DE RECUPERAÇÃO:');
    console.log('');
    console.log('1. 🌐 CACHE DO NAVEGADOR:');
    console.log('   - Abra DevTools (F12)');
    console.log('   - Application → Local Storage → localhost:5173');
    console.log('   - Procure por: preloaded_demands, preloaded_transactions');
    console.log('');
    console.log('2. 📱 NETWORK TAB:');
    console.log('   - DevTools → Network');
    console.log('   - Procure requisições antigas para jsonbin.io');
    console.log('   - Veja a resposta (Response) das requisições GET');
    console.log('');
    console.log('3. 💾 BACKUP MANUAL:');
    console.log('   - Se você fez algum backup manual dos dados');
    console.log('   - Ou se tem prints/anotações das demandas');
    console.log('');
    console.log('4. 🔄 RESTAURAR ESTRUTURA BÁSICA:');
    console.log('   - Execute: node setup-database.js');
    console.log('   - Isso criará uma base funcional com dados de exemplo');
    
  } catch (error) {
    console.error('❌ Erro na recuperação:', error.message);
  }
}

// Executar recuperação
recoverPreviousData();
