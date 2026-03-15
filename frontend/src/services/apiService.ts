// [Member 3 - Abhinav] frontend/src/services/apiService.ts

import axios, { AxiosResponse } from 'axios';

/**
 * Request shape for the summary generation.
 */
export interface GenerateSummaryRequest {
  session_id: string;
}

/**
 * Response payload shape for the session status endpoint.
 */
export interface SessionStatusResponse {
  status: string;
  language: string;
}

const BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Dispatches a CustomEvent "vani:language-selected" allowing the
 * WebSocket service to tap into the UI language selection event.
 * 
 * @param languageCode - The code representing the selected language (e.g. 'en', 'hi').
 */
export function notifyWebSocket(languageCode: string): void {
  const event = new CustomEvent('vani:language-selected', {
    detail: { languageCode }
  });
  window.dispatchEvent(event);
}

/**
 * Hits the backend to generate the session summary, returning the PDF Blob on success,
 * and automatically initiating a robust browser file download.
 * 
 * @param sessionId - Session identifier.
 * @returns A promise resolving to the downloaded PDF Blob.
 */
export async function generateSummary(sessionId: string): Promise<Blob> {
  try {
    const payload: GenerateSummaryRequest = { session_id: sessionId };
    
    const response: AxiosResponse<Blob> = await axios.post(
      `${BASE_URL}/api/generate-summary`,
      payload,
      { responseType: 'blob' }
    );

    const blob = response.data;
    
    // Automatically trigger browser download with temporary anchor.
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `VANI_Summary_${sessionId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);

    return blob;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Summary generation failed: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while generating the summary.');
  }
}

/**
 * Fetches the current session language & status state.
 * Specifically built to handle 404 cleanly by returning fallback not_found format.
 * 
 * @param sessionId - Session identifier.
 * @returns The session's status config.
 */
export async function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  try {
    const response: AxiosResponse<SessionStatusResponse> = await axios.get(
      `${BASE_URL}/api/session/${sessionId}`
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { status: 'not_found', language: '' };
    }
    throw new Error('Failed to retrieve session status.');
  }
}
