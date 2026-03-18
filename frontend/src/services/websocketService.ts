import type { VANIMessage, SessionMeta } from '../types/transcript.ts';

class VANIWebSocketService {
  public ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  public onMessage: ((msg: VANIMessage) => void) | null = null;
  public onSessionMeta: ((meta: SessionMeta) => void) | null = null;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private isConnecting: boolean = false;
  private stream: MediaStream | null = null;
  private selectedLanguage: string = 'hi'; // default to Hindi

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING))) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket('ws://localhost:8000/ws/stream');

      // The event listener must be added only once
      // Register it when the session starts
      window.addEventListener('vani:language-selected', (e: Event) => {
        const { languageCode } = (e as CustomEvent<{ languageCode: string }>).detail;
        this.selectedLanguage = languageCode;
      });

      this.ws.onopen = async () => {
        this.isConnecting = false;
        
        this.ws?.send(JSON.stringify({ 
          type: 'session_start', 
          language: this.selectedLanguage 
        }));

        this.startPing();
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.setupRecorder(this.stream);
        } catch (err) {
          console.error('Failed to get user media', err);
        }
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          this.handleMessage(event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.cleanup();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Connection setup failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setupRecorder(stream: MediaStream): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(event.data);
      }
    };
    // Record chunks every 250ms
    this.mediaRecorder.start(250);
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw) as VANIMessage;
      if (msg.type === 'session_meta' && this.onSessionMeta) {
        this.onSessionMeta(msg);
      }
      if (this.onMessage) {
        this.onMessage(msg);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message', e);
    }
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'ping',
          language: this.selectedLanguage 
        }));
      }
    }, 30000);
  }

  private cleanup(): void {
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout !== null) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }
}

export const vaniWS = new VANIWebSocketService();
