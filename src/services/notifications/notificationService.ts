class NotificationService {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return Notification.permission;
    }
  }

  public sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon.svg',
        tag: options?.tag || 'todolist-reminder',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to create browser notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
