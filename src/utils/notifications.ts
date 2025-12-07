// Util simples para notificações nativas do navegador

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Solicita permissão do usuário
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

// Dispara uma notificação simples
export async function showNotification(
  title: string,
  message: string,
  icon?: string
): Promise<void> {
  if (!isNotificationSupported()) return;

  const allowed = await requestNotificationPermission();
  if (!allowed) return;

  try {
    new Notification(title, {
      body: message,
      icon: icon || ''
    });
  } catch (err) {
    console.warn('Falha ao exibir notificação:', err);
  }
}
