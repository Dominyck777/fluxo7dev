import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    
    // Configurações de desenvolvimento
    server: isProduction ? undefined : {
      proxy: {
        // Rota para a API
        '/api': {
          target: isProduction ? 'https://fluxo7dev.vercel.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: isProduction,
          rewrite: (path: string) => path.replace(/^\/api/, isProduction ? '/api' : '')
        },
        // Rota para notificações push
        '/notify-user': {
          target: isProduction ? 'https://fluxo7dev.vercel.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: isProduction
        },
        // Rota para a chave VAPID
        '/vapid-public-key': {
          target: isProduction ? 'https://fluxo7dev.vercel.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: isProduction
        },
        // Rota de saúde
        '/health': {
          target: isProduction ? 'https://fluxo7dev.vercel.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: isProduction
        }
      },
      // Configuração de CORS para desenvolvimento
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204
      },
      // Configuração para permitir acesso de qualquer host
      host: true,
      // Configuração para exibir erros detalhados
      strictPort: true,
      open: !isProduction
    },
    
    // Configurações de build para produção
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            vendor: ['@supabase/supabase-js', 'web-push']
          }
        }
      }
    },
    
    // Configurações gerais
    define: {
      'process.env': {}
    }
  };
});
