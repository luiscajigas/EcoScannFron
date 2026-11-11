import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { LiveUpdatesService } from './live-updates.service';

/** Stand-in for the browser WebSocket: the test decides when the server answers. */
class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  closedWith: number | null = null;

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code: number): void {
    this.closedWith = code;
  }

  serverSends(message: object): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }

  serverCloses(code: number): void {
    this.onclose?.({ code });
  }
}

describe('LiveUpdatesService', () => {
  const realWebSocket = window.WebSocket;
  let token: string | null;
  let service: LiveUpdatesService;
  let updates: number;

  const lastSocket = () => FakeSocket.instances[FakeSocket.instances.length - 1];

  beforeEach(() => {
    FakeSocket.instances = [];
    token = 'jwt-token';
    (window as unknown as { WebSocket: unknown }).WebSocket = FakeSocket;
    TestBed.configureTestingModule({
      providers: [LiveUpdatesService, { provide: AuthService, useValue: { get token() { return token; } } }]
    });
    service = TestBed.inject(LiveUpdatesService);
    updates = 0;
    service.rankingUpdates.subscribe(() => updates++);
  });

  afterEach(() => {
    service.ngOnDestroy();
    window.WebSocket = realWebSocket;
  });

  it('signs in with the first message and becomes live when the server is ready', () => {
    service.connect();
    const socket = lastSocket();
    expect(socket.url).toBe(environment.liveUrl);
    expect(service.status()).toBe('connecting');

    socket.onopen?.();
    expect(JSON.parse(socket.sent[0])).toEqual({ type: 'auth', token: 'jwt-token' });

    socket.serverSends({ type: 'ready' });
    expect(service.status()).toBe('live');
    expect(updates).toBe(0);
  });

  it('emits an update when the ranking changes and ignores what it does not understand', () => {
    service.connect();
    lastSocket().serverSends({ type: 'ready' });
    lastSocket().serverSends({ type: 'ranking-updated' });
    lastSocket().onmessage?.({ data: 'not json' });
    expect(updates).toBe(1);
  });

  it('stays offline without a session', () => {
    token = null;
    service.connect();
    expect(FakeSocket.instances.length).toBe(0);
    expect(service.status()).toBe('offline');
  });

  it('reconnects with a growing delay and asks for fresh data once back', fakeAsync(() => {
    service.connect();
    lastSocket().serverSends({ type: 'ready' });

    lastSocket().serverCloses(1006);
    expect(service.status()).toBe('offline');
    tick(999);
    expect(FakeSocket.instances.length).toBe(1);
    tick(1);
    expect(FakeSocket.instances.length).toBe(2);

    lastSocket().serverCloses(1006);
    tick(1999);
    expect(FakeSocket.instances.length).toBe(2);
    tick(1);
    expect(FakeSocket.instances.length).toBe(3);

    lastSocket().serverSends({ type: 'ready' });
    expect(service.status()).toBe('live');
    expect(updates).toBe(1);
  }));

  it('does not retry when the server rejects the token', fakeAsync(() => {
    service.connect();
    lastSocket().serverCloses(1008);
    tick(60000);
    expect(FakeSocket.instances.length).toBe(1);
    expect(service.status()).toBe('offline');
  }));

  it('closes the connection and stops retrying when destroyed', fakeAsync(() => {
    service.connect();
    const socket = lastSocket();
    service.ngOnDestroy();
    expect(socket.closedWith).toBe(1000);
    socket.serverCloses(1000);
    tick(60000);
    expect(FakeSocket.instances.length).toBe(1);
  }));
});
