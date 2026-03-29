import type { VANIMessage, SessionMeta } from '../types/transcript.ts';

class VANIWebSocketService {
  constructor(){
    window.addEventListener('vani:language-selected', (e: Event) => {
      const { languageCode } = (e as CustomEvent<{ languageCode: string }>).detail;
      this.selectedLanguage = languageCode;
    });
  }
  public ws: WebSocket | null = null;
  public onMessage: ((msg: VANIMessage) => void) | null = null;
  public onSessionMeta: ((meta: SessionMeta) => void) | null = null;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private isConnecting: boolean = false;
  private intentionalDisconnect: boolean = false;
  private selectedLanguage: string = 'hi'; // default to Hindi

  // receiveOnly = true  → used by the Staff Dashboard (listen for broadcasts, no mic)
  // receiveOnly = false → used by the Customer Tablet (send audio + receive)
  private receiveOnly: boolean = false;

  async connect(receiveOnly: boolean = false): Promise<void> {
    this.receiveOnly = receiveOnly;
    this.intentionalDisconnect = false;
    if (this.isConnecting || (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING))) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = window.location.hostname === 'localhost'
        ? 'ws://localhost:3000/ws/stream'
        : `ws://${window.location.host}/ws/stream`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.isConnecting = false;

        this.ws?.send(JSON.stringify({
          type: 'session_start',
          language: this.selectedLanguage
        }));

        this.startPing();
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
    this.intentionalDisconnect = true;
    this.isConnecting = false; // must reset — onclose is nulled below, so it won't reset itself
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

  /**
   * Stop recording audio and release the microphone, but keep the WebSocket
   * connection open so incoming transcript_update broadcasts from the backend
   * (which arrive 15-20s after audio capture ends) can still be received.
   */
  stopRecording(): void {
    this.intentionalDisconnect = true; 
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
    }, 5000);
  }

  private cleanup(): void {
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalDisconnect) return;
    if (this.reconnectTimeout !== null) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(this.receiveOnly); // preserve the mode across reconnects
    }, 3000);
  }
}

export const vaniWS = new VANIWebSocketService();
