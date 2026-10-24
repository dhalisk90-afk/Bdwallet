// Simple Local Browser Notification and Web Audio Sound System

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve(false);
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve(true);
  }
  if (Notification.permission !== 'denied') {
    return Notification.requestPermission().then((permission) => permission === 'granted');
  }
  return Promise.resolve(false);
}

// Play pleasant notification chime using Web Audio API
export function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    console.warn('Audio chime play failed:', err);
  }
}

export function showBrowserNotification(title: string, body: string, tag?: string) {
  playNotificationSound();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: tag || 'bd-wallet-notification',
      });
    } catch (err) {
      console.warn('Browser notification error:', err);
    }
  } else if (Notification.permission !== 'denied') {
    requestNotificationPermission().then((granted) => {
      if (granted) {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: tag || 'bd-wallet-notification',
          });
        } catch {}
      }
    });
  }
}

export function notifyNewTransaction(amount: number, type: string, description: string) {
  const typeText = type === 'deposit' ? 'ডিপোজিট' : type === 'withdrawal' ? 'উত্তোলন' : 'কমিশন লেনদেন';
  const title = `💰 নতুন লেনদেন আপডেট: ৳${amount.toLocaleString()}`;
  const body = `${typeText}: ${description}`;
  showBrowserNotification(title, body, 'tx-notification');
}

export function notifyNewChatMessage(senderName: string, message: string) {
  const title = `💬 নতুন চ্যাট বার্তা (${senderName})`;
  const body = message.length > 60 ? message.slice(0, 60) + '...' : message;
  showBrowserNotification(title, body, 'chat-notification');
}
