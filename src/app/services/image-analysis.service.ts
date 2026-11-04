import { Injectable, OnDestroy } from '@angular/core';
import { AnalysisRequest, AnalysisResponse, AnalysisResult } from '../workers/analysis.messages';

const ANALYSIS_LIMIT_MS = 30000;

export type AnalysisErrorReason = 'unsupported' | 'timed-out' | 'worker-crashed' | 'invalid-image';

export class ImageAnalysisError extends Error {
  constructor(readonly reason: AnalysisErrorReason, detail = '') {
    super(detail);
    this.name = 'ImageAnalysisError';
  }
}

interface PendingAnalysis {
  resolve: (result: AnalysisResult) => void;
  reject: (error: ImageAnalysisError) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Hides the Web Worker behind a Promise. It creates the Worker on first use,
 * terminates it when the page is destroyed and recreates it if it crashes, so a
 * thread failure never leaves the interface waiting forever.
 */
@Injectable()
export class ImageAnalysisService implements OnDestroy {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, PendingAnalysis>();

  analyze(file: Blob): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      if (typeof Worker === 'undefined') {
        reject(new ImageAnalysisError('unsupported'));
        return;
      }

      const id = this.nextId++;
      const timer = setTimeout(
        () => this.discardWorker(new ImageAnalysisError('timed-out')),
        ANALYSIS_LIMIT_MS
      );
      this.pending.set(id, { resolve, reject, timer });

      const request: AnalysisRequest = { id, file };
      this.getWorker().postMessage(request);
    });
  }

  ngOnDestroy(): void {
    this.discardWorker(new ImageAnalysisError('worker-crashed', 'The page was closed.'));
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/analysis.worker', import.meta.url));
      this.worker.onmessage = ({ data }: MessageEvent<AnalysisResponse>) => this.receive(data);
      this.worker.onerror = () => this.discardWorker(new ImageAnalysisError('worker-crashed'));
    }
    return this.worker;
  }

  private receive(response: AnalysisResponse): void {
    const analysis = this.pending.get(response.id);
    if (!analysis) return;

    clearTimeout(analysis.timer);
    this.pending.delete(response.id);

    if (response.ok) {
      analysis.resolve(response.result);
    } else {
      analysis.reject(new ImageAnalysisError('invalid-image', response.error));
    }
  }

  /** Terminates the thread and rejects what was in progress; the next analysis creates a new one. */
  private discardWorker(error: ImageAnalysisError): void {
    this.worker?.terminate();
    this.worker = null;

    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    this.pending.clear();
  }
}
