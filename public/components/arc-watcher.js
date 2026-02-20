/**
 * Arc File Watcher
 * Watches app.arc file for changes and triggers live reload
 */

export class ArcWatcher {
  constructor(options = {}) {
    this.onArcChanged = options.onArcChanged || (() => {});
    this.arcDataUrl = options.arcDataUrl || '/arc-data';
    this.pollInterval = options.pollInterval || 2000; // 2 seconds
    this.lastData = null;
    this.isWatching = false;
    this.pollTimeout = null;
    this.listeners = new Map();
  }

  /**
   * Start watching for Arc file changes
   */
  start() {
    if (this.isWatching) return;
    this.isWatching = true;
    console.log('Arc Watcher: Starting...');
    
    // Try WebSocket first, fall back to polling
    this.tryWebSocketConnection();
  }

  /**
   * Attempt WebSocket connection for real-time updates
   */
  tryWebSocketConnection() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/arc-updates`);

      ws.addEventListener('open', () => {
        console.log('Arc Watcher: WebSocket connected');
        this.emit('connected');
      });

      ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'arc-changed') {
          console.log('Arc Watcher: Arc file changed via WebSocket');
          this.handleArcChanged(data.arcData);
        }
      });

      ws.addEventListener('error', () => {
        console.log('Arc Watcher: WebSocket failed, falling back to polling');
        this.startPolling();
      });

      ws.addEventListener('close', () => {
        console.log('Arc Watcher: WebSocket closed, reconnecting...');
        if (this.isWatching) {
          setTimeout(() => this.tryWebSocketConnection(), 5000);
        }
      });
    } catch (err) {
      console.warn('Arc Watcher: WebSocket not available, using polling');
      this.startPolling();
    }
  }

  /**
   * Fallback: poll for changes
   */
  startPolling() {
    if (!this.isWatching) return;

    this.pollTimeout = setTimeout(async () => {
      try {
        const response = await fetch(this.arcDataUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Check if data changed (simple hash comparison)
        const hash = JSON.stringify(data);
        if (this.lastData !== hash) {
          console.log('Arc Watcher: Arc data changed via polling');
          this.lastData = hash;
          this.handleArcChanged(data);
        }
      } catch (error) {
        console.error('Arc Watcher: Poll error:', error);
      } finally {
        this.startPolling();
      }
    }, this.pollInterval);
  }

  /**
   * Handle Arc file changes
   */
  async handleArcChanged(newData) {
    this.emit('arc-changed', { arcData: newData });
    
    if (this.onArcChanged) {
      try {
        await this.onArcChanged(newData);
      } catch (error) {
        console.error('Arc Watcher: Error in onArcChanged callback:', error);
      }
    }
  }

  /**
   * Stop watching
   */
  stop() {
    if (!this.isWatching) return;
    this.isWatching = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log('Arc Watcher: Stopped');
  }

  /**
   * Get current Arc data
   */
  async getCurrentData() {
    try {
      const response = await fetch(this.arcDataUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Arc Watcher: Failed to fetch Arc data:', error);
      return null;
    }
  }

  /**
   * Simple event emitter
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const idx = callbacks.indexOf(callback);
    if (idx !== -1) {
      callbacks.splice(idx, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Arc Watcher: Error in ${event} listener:`, error);
      }
    });
  }
}

export default ArcWatcher;
