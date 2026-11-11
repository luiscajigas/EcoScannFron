import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { LiveClientMessage, LiveServerMessage } from '../models/models';
import { AuthService } from './auth.service';

export type LiveStatus = 'connecting' | 'live' | 'offline';

// Waits longer after each failed attempt so a sleeping server is not hammered.
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const POLICY_VIOLATION = 1008;
const NORMAL_CLOSURE = 1000;

/**
 * WebSocket connection to /api/live. It signs in with the first message (a
 * browser cannot send headers on a WebSocket) and reconnects on its own. It
 * only says that something changed: the data still comes from the REST API.
 * Provided by the page that uses it, so the connection lives as long as that page.
 */
@Injectable()
export class LiveUpdatesService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly updates = new Subject<void>();
  private socket: WebSocket | null = null;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private failedAttempts = 0;
  private hasBeenLive = false;
  private isStopped = true;

  readonly status = signal<LiveStatus>('offline');
  readonly rankingUpdates = this.updates.asObservable();

  connect(): void {
    this.isStopped = false;
    this.open();
  }

  ngOnDestroy(): void {
    this.isStopped = true;
    clearTimeout(this.retryTimer);
    this.socket?.close(NORMAL_CLOSURE);
    this.socket = null;
    this.updates.complete();
  }

  private open(): void {
    const token = this.auth.token;
    if (!token || typeof WebSocket === 'undefined') {
      this.status.set('offline');
      return;
    }

    this.status.set('connecting');
    const socket = new WebSocket(environment.liveUrl);
    this.socket = socket;

    socket.onopen = () => {
      const message: LiveClientMessage = { type: 'auth', token };
      socket.send(JSON.stringify(message));
    };
    socket.onmessage = ({ data }) => this.receive(data);
    socket.onclose = ({ code }) => this.handleClose(socket, code);
  }

  private receive(data: unknown): void {
    let message: LiveServerMessage;
    try {
      message = JSON.parse(String(data));
    } catch {
      return;
    }

    if (message.type === 'ready') {
      this.failedAttempts = 0;
      this.status.set('live');
      // Scans made while the connection was down were missed: ask for fresh data.
      if (this.hasBeenLive) this.updates.next();
      this.hasBeenLive = true;
    } else if (message.type === 'ranking-updated') {
      this.updates.next();
    }
  }

  private handleClose(socket: WebSocket, code: number): void {
    if (socket !== this.socket || this.isStopped) return;
    this.socket = null;
    this.status.set('offline');

    // The server rejected the token: trying again would be rejected the same way.
    if (code === POLICY_VIOLATION) return;

    const delay = RETRY_DELAYS_MS[Math.min(this.failedAttempts, RETRY_DELAYS_MS.length - 1)];
    this.failedAttempts += 1;
    this.retryTimer = setTimeout(() => this.open(), delay);
  }
}
