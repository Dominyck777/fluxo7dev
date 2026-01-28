import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    
    // ConfiguraÃ§Ãµes de desenvolvimento
    server: isProduction ? undefined : {
      proxy: {
        // Rota para a API
        '/api': {
          target: isProduction ? 'https://fluxo7dev.vercel.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: isProduction,
          rewrite: (path: string) => path.replace(/^\/api/, isProduction ? '/api' : '')
        },
        // Rota para notificaÃ§Ãµes push
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
        // Rota de saÃºde
        '/health': {
          target: isProduction ? 'https://fluxo7dev.vercel.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: isProduction
        }
      },
      // ConfiguraÃ§Ã£o de CORS para desenvolvimento
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204
      },
      // ConfiguraÃ§Ã£o para permitir acesso de qualquer host
      host: true,
      // ConfiguraÃ§Ã£o para exibir erros detalhados
      strictPort: true,
      open: !isProduction
    },
    
    // ConfiguraÃ§Ãµes de build para produÃ§Ã£o
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            vendor: ['@supabase/supabase-js']
          }
        }
      }
    },
    
    // ConfiguraÃ§Ãµes gerais
    define: {
      'process.env': {}
    }
  };
});
