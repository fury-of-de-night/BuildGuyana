import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadDocumentForVerification } from '../verificationApi';
import { normalizeVerificationStatus } from '@/lib/verificationStatus';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mocks.getSession }, from: mocks.from } }));
const file = new File(['image'], 'identity.png', { type: 'image/png' });
const options = { file, userId: 'user-1', documentType: 'National ID', verificationId: 'pending-1' };
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'test-session-token' } }, error: null });
  fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
describe('verification API contract', () => {
  it('sends an authenticated document and returns the canonical record without inserting another row', async () => {
    const record = { id: 'pending-1', status: 'MANUAL_REVIEW' };
    fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ success: true, record }) });
    const result = await uploadDocumentForVerification(options);
    expect(result).toMatchObject({ success: true, record });
    const request = fetchMock.mock.calls[0][1];
    expect(request.headers.Authorization).toBe('Bearer test-session-token');
    expect(request.body.get('document')).toBe(file);
    expect(request.body.get('file')).toBeNull();
    expect(request.body.get('verification_id')).toBe('pending-1');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not upload without a session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect((await uploadDocumentForVerification(options)).success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('shows the backend error message', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => JSON.stringify({ error: 'Invalid image.' }) });
    expect((await uploadDocumentForVerification(options)).message).toBe('Invalid image.');
  });
  it('does not report success if the backend did not confirm a saved record', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ success: true }) });
    expect((await uploadDocumentForVerification(options)).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('handles non-JSON responses without throwing', async () => {
    fetchMock.mockResolvedValue({ ok: false, text: async () => 'Service unavailable' });
    expect((await uploadDocumentForVerification(options)).success).toBe(false);
  });
  it.each([['MANUALLY_APPROVED', 'approved'], ['MANUALLY_REJECTED', 'rejected'], ['AUTO_APPROVED', 'auto_approved']])('recognizes %s', (input, output) => {
    expect(normalizeVerificationStatus(input)).toBe(output);
  });
});
