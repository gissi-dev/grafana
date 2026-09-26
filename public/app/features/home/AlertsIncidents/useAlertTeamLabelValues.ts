import { useAsync } from 'react-use';

import { rangeUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { type ComboboxOption } from '@grafana/ui';
import { fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import { OWNERSHIP_LABEL_KEYS, encodeOwnershipFilter } from './teamFilter';

const TEAM_VALUES_TIME_RANGE = { from: 'now-7d', to: 'now' };
// Stable so the combobox's sort memo doesn't rerun on every render while hidden.
const NO_VALUES: Array<ComboboxOption<string>> = [];

/**
 * Ownership label values (`team`, `squad`, `owner`) seen on alerts over the last
 * 7 days, from the state-history Prometheus datasource — that's what the
 * alertmanager matcher actually filters on, not Grafana org teams. Each value is
 * grouped under its label key and selects the encoded `key:value`. Empty while
 * loading, on error, or when the datasource isn't configured, so the dropdown
 * stays hidden in all three cases. A key with no values, or one whose fetch
 * fails, is skipped so the other keys still show.
 */
export function useAlertTeamLabelValues(enabled: boolean): Array<ComboboxOption<string>> {
  // Read at render time (not module scope) so tests can vary the config.
  const datasourceConfigured = Boolean(config.unifiedAlerting.stateHistory?.prometheusTargetDatasourceUID);
  const shouldFetch = enabled && datasourceConfigured;

  // Fetched once per mount; the label-value set changes slowly enough that
  // client-side filtering over it covers the search box.
  const { value, loading, error } = useAsync(async () => {
    if (!shouldFetch) {
      return NO_VALUES;
    }
    const range = rangeUtil.convertRawToRange(TEAM_VALUES_TIME_RANGE);
    const groups = await Promise.all(
      OWNERSHIP_LABEL_KEYS.map(async (key) => {
        try {
          const values = await fetchTagValues(range, key);
          return values.flatMap((v) => {
            const labelValue = String(v.value ?? v.text ?? '');
            if (!labelValue) {
              return [];
            }
            return [{ label: labelValue, value: encodeOwnershipFilter(key, labelValue), group: key }];
          });
        } catch {
          return [];
        }
      })
    );
    return groups.flat();
  }, [shouldFetch]);

  return loading || error ? NO_VALUES : (value ?? NO_VALUES);
}
