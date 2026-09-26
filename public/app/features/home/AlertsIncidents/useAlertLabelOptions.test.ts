import { renderHook, waitFor } from 'test/test-utils';

import { config } from '@grafana/runtime';
import { fetchTagKeys, fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import { useAlertLabelOptions } from './useAlertLabelOptions';

jest.mock('app/features/alerting/unified/triage/scene/tagKeysProviders', () => ({
  fetchTagKeys: jest.fn(),
  fetchTagValues: jest.fn(),
}));

const originalStateHistory = config.unifiedAlerting.stateHistory;

beforeEach(() => {
  config.unifiedAlerting.stateHistory = {
    ...originalStateHistory,
    prometheusTargetDatasourceUID: 'state-history-ds',
  };
  jest.mocked(fetchTagKeys).mockReset();
  jest.mocked(fetchTagValues).mockReset();
});

afterEach(() => {
  config.unifiedAlerting.stateHistory = originalStateHistory;
});

describe('useAlertLabelOptions', () => {
  it('omits a label whose values request fails and keeps the rest', async () => {
    jest.mocked(fetchTagKeys).mockResolvedValue([
      { text: 'team', value: 'team' },
      { text: 'squad', value: 'squad' },
    ]);
    jest.mocked(fetchTagValues).mockImplementation(async (_timeRange, key) => {
      if (key === 'squad') {
        throw new Error('values failed');
      }
      return [{ text: 'Platform', value: 'Platform' }];
    });

    const { result } = renderHook(() => useAlertLabelOptions(true));

    await waitFor(() => expect(result.current).toEqual([{ label: 'Platform', value: 'team:Platform', group: 'team' }]));
  });

  it('returns no options and skips value requests when label keys fail', async () => {
    let rejectKeys: (error: Error) => void = () => {};
    jest.mocked(fetchTagKeys).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectKeys = reject;
      })
    );

    const { result } = renderHook(() => useAlertLabelOptions(true));

    await waitFor(() => expect(fetchTagKeys).toHaveBeenCalled());
    expect(fetchTagValues).not.toHaveBeenCalled();

    rejectKeys(new Error('keys failed'));

    await waitFor(() => expect(result.current).toEqual([]));
    expect(fetchTagValues).not.toHaveBeenCalled();
  });

  it('loads a value for every label past the in-flight cap', async () => {
    const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    jest.mocked(fetchTagKeys).mockResolvedValue(keys.map((key) => ({ text: key, value: key })));
    jest
      .mocked(fetchTagValues)
      .mockImplementation(async (_timeRange, key) => [{ text: `${key}-v`, value: `${key}-v` }]);

    const { result } = renderHook(() => useAlertLabelOptions(true));

    await waitFor(() =>
      expect(result.current.map((option) => option.value).sort()).toEqual([
        'a:a-v',
        'b:b-v',
        'c:c-v',
        'd:d-v',
        'e:e-v',
        'f:f-v',
        'g:g-v',
        'h:h-v',
      ])
    );
  });

  it('does not fetch when the state-history datasource is not configured', async () => {
    config.unifiedAlerting.stateHistory = { ...originalStateHistory, prometheusTargetDatasourceUID: undefined };

    const { result } = renderHook(() => useAlertLabelOptions(true));

    await waitFor(() => expect(result.current).toEqual([]));
    expect(fetchTagKeys).not.toHaveBeenCalled();
  });
});
