import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile, copyToClipboard } from './downloadHelper';

describe('downloadHelper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('triggers download with blob URL and appends anchor to body when in browser', async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockClick = vi.fn();

    const mockAnchor: any = {
      style: {},
      setAttribute: vi.fn(),
      click: mockClick,
      dispatchEvent: vi.fn(),
      parentNode: {
        removeChild: mockRemoveChild,
      },
    };

    vi.stubGlobal('window', {
      URL: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      },
    });

    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    });

    const result = await downloadFile('{"test": true}', 'test_backup.json');

    expect(result.success).toBe(true);
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
    expect(mockClick).toHaveBeenCalled();
  });

  it('copies text to clipboard when navigator.clipboard is available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const success = await copyToClipboard('test clipboard text');
    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('test clipboard text');
  });
});

