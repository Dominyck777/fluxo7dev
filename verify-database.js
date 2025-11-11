import https from 'https';

// Configurações do JSONBin
const BIN_ID = '690605e5ae596e708f3c7bc5';
const API_KEY = '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2';
const BASE_URL = 'https://api.jsonbin.io/v3';

// Função para fazer requisição HTTPS
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
    
    req.end();
  });
}

async function verifyDatabase() {
  try {
    console.log('🔍 Verificando integridade da base de dados...\n');
    
    // Buscar dados atuais
    const response = await makeRequest(`${BASE_URL}/b/${BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    const data = response.record;
    
    // Verificar estrutura principal
    console.log('📊 ESTRUTURA DA BASE DE DADOS:');
    console.log('================================');
    
    // Desenvolvedores
    console.log(`👥 DESENVOLVEDORES (${data.devs?.length || 0}):`);
    if (data.devs) {
      data.devs.forEach(dev => {
        const status = dev.active ? '✅' : '❌';
        console.log(`   ${status} ${dev.name} (${dev.id}) - ${dev.role}`);
      });
    }
    console.log();
    
    // Projetos
    console.log(`📁 PROJETOS (${data.projects?.length || 0}):`);
    if (data.projects) {
      data.projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project}`);
      });
    }
    console.log();
    
    // Prioridades
    console.log(`🎯 PRIORIDADES (${data.priorities?.length || 0}):`);
    if (data.priorities) {
      data.priorities.forEach((priority, index) => {
        console.log(`   ${index + 1}. ${priority}`);
      });
    }
    console.log();
    
    // Demandas
    console.log(`📋 DEMANDAS (${data.demands?.length || 0}):`);
    if (data.demands) {
      data.demands.forEach(demand => {
        const statusIcon = demand.status === 'Pendente' ? '🟡' : '✅';
        const priorityIcon = {
          'Baixa': '🟢',
          'Média': '🟡', 
          'Alta': '🟠',
          'Urgente': '🔴'
        }[demand.prioridade] || '⚪';
        
        console.log(`   ${statusIcon} ${demand.projeto} - ${demand.desenvolvedor}`);
        console.log(`      ${priorityIcon} ${demand.prioridade} | ${demand.status}`);
        console.log(`      📝 ${demand.descricao.substring(0, 60)}...`);
        console.log();
      });
    }
    
    // Transações
    console.log(`💰 TRANSAÇÕES FINANCEIRAS (${data.transactions?.length || 0}):`);
    if (data.transactions) {
      let totalEntradas = 0;
      let totalSaidas = 0;
      
      data.transactions.forEach(transaction => {
        const typeIcon = transaction.type === 'Entrada' ? '💵' : '💸';
        const value = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(transaction.value);
        
        console.log(`   ${typeIcon} ${value} - ${transaction.description}`);
        console.log(`      📁 ${transaction.project} | ${new Date(transaction.date).toLocaleDateString('pt-BR')}`);
        
        if (transaction.type === 'Entrada') {
          totalEntradas += transaction.value;
        } else {
          totalSaidas += transaction.value;
        }
      });
      
      console.log('\n   📊 RESUMO FINANCEIRO:');
      console.log(`      💵 Total Entradas: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradas)}`);
      console.log(`      💸 Total Saídas: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaidas)}`);
      console.log(`      💰 Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradas - totalSaidas)}`);
      
      if (totalEntradas > 0) {
        const margem = ((totalEntradas - totalSaidas) / totalEntradas * 100);
        console.log(`      📈 Margem de Lucro: ${margem.toFixed(1)}%`);
      }
    }
    console.log();
    
    // Feedbacks
    console.log(`⭐ FEEDBACKS DE SATISFAÇÃO (${data['feedback-isis']?.length || 0}):`);
    if (data['feedback-isis']) {
      let totalEstrelas = 0;
      const distribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      data['feedback-isis'].forEach(feedback => {
        const stars = '⭐'.repeat(feedback.estrelas) + '☆'.repeat(5 - feedback.estrelas);
        console.log(`   ${stars} ${feedback.nome_cliente} - ${feedback.empresa}`);
        console.log(`      📁 ${feedback.projeto} | ${new Date(feedback.timestamp).toLocaleDateString('pt-BR')}`);
        if (feedback.comentario) {
          console.log(`      💬 "${feedback.comentario.substring(0, 80)}..."`);
        }
        console.log();
        
        totalEstrelas += feedback.estrelas;
        distribuicao[feedback.estrelas]++;
      });
      
      const mediaEstrelas = totalEstrelas / data['feedback-isis'].length;
      console.log('   📊 ESTATÍSTICAS:');
      console.log(`      ⭐ Média Geral: ${mediaEstrelas.toFixed(1)} estrelas`);
      console.log('      📈 Distribuição:');
      for (let i = 5; i >= 1; i--) {
        const count = distribuicao[i];
        const percentage = ((count / data['feedback-isis'].length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(count / 2)) || '▏';
        console.log(`         ${i}⭐ ${count} (${percentage}%) ${bar}`);
      }
    }
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 CREDENCIAIS DE TESTE:');
    console.log('   • admin / admin123 (Administrador)');
    console.log('   • dominyck / dev123 (Desenvolvedor)');
    console.log('   • joao / joao123 (Desenvolvedor)');
    console.log('   • maria / maria123 (Desenvolvedor)');
    
    console.log('\n🌐 ACESSO À APLICAÇÃO:');
    console.log('   • URL: http://localhost:5173');
    console.log('   • Status: Base de dados operacional ✅');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    process.exit(1);
  }
}

// Executar verificação
verifyDatabase();
