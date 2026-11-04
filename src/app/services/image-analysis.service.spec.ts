import { fakeAsync, tick } from '@angular/core/testing';
import { AnalysisRequest, AnalysisResponse, AnalysisResult } from '../workers/analysis.messages';
import { ImageAnalysisError, ImageAnalysisService } from './image-analysis.service';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: AnalysisResponse }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: AnalysisRequest[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: AnalysisRequest): void {
    this.sent.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }
}

const RESULT: AnalysisResult = {
  categoryKey: 'plastic',
  confidence: 0.6,
  widthPx: 10,
  heightPx: 10,
  compressedImageBase64: 'data:image/jpeg;base64,AAAA'
};

describe('ImageAnalysisService', () => {
  const globalScope = globalThis as unknown as { Worker: unknown };
  const realWorker = globalScope.Worker;
  let service: ImageAnalysisService;

  beforeEach(() => {
    FakeWorker.instances = [];
    globalScope.Worker = FakeWorker;
    service = new ImageAnalysisService();
  });

  afterEach(() => {
    service.ngOnDestroy();
    globalScope.Worker = realWorker;
  });

  const lastWorker = () => FakeWorker.instances[FakeWorker.instances.length - 1];

  it('resolves each analysis with the response of its own id', async () => {
    const first = service.analyze(new Blob());
    const second = service.analyze(new Blob());
    const worker = lastWorker();
    const [firstId, secondId] = worker.sent.map((m) => m.id);

    worker.onmessage!({ data: { id: secondId, ok: true, result: { ...RESULT, widthPx: 2 } } });
    worker.onmessage!({ data: { id: firstId, ok: true, result: { ...RESULT, widthPx: 1 } } });

    expect((await first).widthPx).toBe(1);
    expect((await second).widthPx).toBe(2);
  });

  it('reuses the same thread between analyses', async () => {
    const analysis = service.analyze(new Blob());
    const worker = lastWorker();
    worker.onmessage!({ data: { id: worker.sent[0].id, ok: true, result: RESULT } });
    await analysis;

    service.analyze(new Blob()).catch(() => undefined);
    expect(FakeWorker.instances.length).toBe(1);
  });

  it('rejects if the image could not be processed', async () => {
    const analysis = service.analyze(new Blob());
    const worker = lastWorker();
    worker.onmessage!({ data: { id: worker.sent[0].id, ok: false, error: 'invalid format' } });

    const error = await analysis.catch((e) => e);
    expect(error).toBeInstanceOf(ImageAnalysisError);
    expect(error.reason).toBe('invalid-image');
    expect(error.message).toBe('invalid format');
  });

  it('if the thread crashes, it rejects and the next analysis creates another one', async () => {
    const analysis = service.analyze(new Blob());
    const crashed = lastWorker();
    crashed.onerror!();

    expect((await analysis.catch((e) => e)).reason).toBe('worker-crashed');
    expect(crashed.terminated).toBeTrue();

    service.analyze(new Blob()).catch(() => undefined);
    expect(FakeWorker.instances.length).toBe(2);
  });

  it('does not wait forever if the thread never responds', fakeAsync(() => {
    let reason = '';
    service.analyze(new Blob()).catch((e) => (reason = e.reason));

    tick(30000);

    expect(reason).toBe('timed-out');
    expect(lastWorker().terminated).toBeTrue();
  }));

  it('terminates the thread when destroyed', async () => {
    const analysis = service.analyze(new Blob());
    const worker = lastWorker();
    service.ngOnDestroy();

    await analysis.catch(() => undefined);
    expect(worker.terminated).toBeTrue();
  });

  it('rejects if the browser does not support Workers', async () => {
    globalScope.Worker = undefined;
    const error = await new ImageAnalysisService().analyze(new Blob()).catch((e) => e);
    expect(error.reason).toBe('unsupported');
  });
});
