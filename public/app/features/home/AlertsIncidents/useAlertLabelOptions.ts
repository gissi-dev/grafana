import { useAsync } from 'react-use';

import { rangeUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { type ComboboxOption } from '@grafana/ui';
import { INTERNAL_LABELS } from 'app/features/alerting/unified/triage/constants';
import { fetchTagKeys, fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import { encodeAlertFilter } from './teamFilter';

const LABEL_VALUES_TIME_RANGE = { from: 'now-7d', to: 'now' };
// How many label-value requests run at once. Alert labels are numerous, so this
// keeps the homepage from opening one request per key all at the same time.
const LABEL_VALUE_CONCURRENCY = 6;
// Stable so the combobox's sort memo doesn't rerun on every render while hidden.
const NO_VALUES: Array<ComboboxOption<string>> = [];

function isUserFacingLabel(key: string): boolean {
  return key.length > 0 && !key.startsWith('__') && !INTERNAL_LABELS.has(key);
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workerCount = Math.min(limit, items.length);

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

/**
 * Values of every non-internal alert label seen over the last 7 days, from the
 * state-history Prometheus datasource — the same source the alertmanager matcher
 * filters on. Shaped for the alerts dropdown: the value is the option label, the
 * selection is `key:value`, and `group` is the label name. Empty while loading,
 * when the keys request fails, or when the datasource isn't configured, so the
 * dropdown stays hidden in those cases. A single label whose values fail is omitted.
 */
export function useAlertLabelOptions(enabled: boolean): Array<ComboboxOption<string>> {
  // Read at render time (not module scope) so tests can vary the config.
  const datasourceConfigured = Boolean(config.unifiedAlerting.stateHistory?.prometheusTargetDatasourceUID);
  const shouldFetch = enabled && datasourceConfigured;

  // Fetched once per mount; the label-value set changes slowly enough that
  // client-side filtering over it covers the search box.
  const { value, loading, error } = useAsync(async () => {
    if (!shouldFetch) {
      return NO_VALUES;
    }
    const timeRange = rangeUtil.convertRawToRange(LABEL_VALUES_TIME_RANGE);
    const keys = await fetchTagKeys(timeRange);
    const labelKeys = [...new Set(keys.map((key) => String(key.value ?? key.text ?? '')).filter(isUserFacingLabel))];

    const optionsByKey = await mapWithConcurrency(labelKeys, LABEL_VALUE_CONCURRENCY, async (key) => {
      try {
        const values = await fetchTagValues(timeRange, key);
        return values.flatMap((entry) => {
          const labelValue = String(entry.value ?? entry.text ?? '');
          if (!labelValue) {
            return [];
          }
          return [{ label: labelValue, value: encodeAlertFilter(key, labelValue), group: key }];
        });
      } catch {
        return [];
      }
    });

    return optionsByKey.flat();
  }, [shouldFetch]);

  return loading || error ? NO_VALUES : (value ?? NO_VALUES);
}
