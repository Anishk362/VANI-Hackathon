export type MessageSender = 'customer' | 'officer';

export interface TranscriptLine {
  id: string;
  sender: MessageSender;
  originalText: string;
  translatedText: string;
  originalLang: string;
  targetLang: string;
  timestamp: string; // ISO string
}

export interface TranscriptUpdate {
  type: 'transcript_update';
  data: TranscriptLine;
}

export interface ProcessTrigger {
  type: 'process_trigger';
  intent: string;
  title: string;
  steps: string[];
  requiredDocs: string[];
}

export interface SessionMeta {
  type: 'session_meta';
  detectedLang: string;
  targetLang: string;
  confidenceScore: number;
  sessionId: string;
}

export interface SummaryReady {
  type: 'summary_ready';
  englishSummary: string;
  nativeSummary: string;
}

export type VANIMessage = TranscriptUpdate | ProcessTrigger | SessionMeta | SummaryReady;
