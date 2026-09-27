import { useAsync } from 'react-use';

import { rangeUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { type ComboboxOption } from '@grafana/ui';
import { fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import {
  HOME_ALERT_OWNERSHIP_LABEL_KEYS,
  encodeAlertFilter,
  ownershipLabelGroup,
  type OwnershipLabelKey,
} from './teamFilter';

const OWNERSHIP_VALUES_TIME_RANGE = { from: 'now-7d', to: 'now' };
// Stable so the combobox's sort memo doesn't rerun on every render while hidden.
const NO_VALUES: Array<ComboboxOption<string>> = [];

/**
 * Ownership label values (`team`, `squad`, `owner`) seen on alerts over the last
 * 7 days, from the state-history Prometheus datasource — that's what the
 * alertmanager matcher actually filters on, not Grafana org teams. Shaped for
 * the alerts filter dropdown: each value under its label key, selecting to the
 * encoded `slug:value`. Empty while loading, on error, or when the datasource
 * isn't configured, so the dropdown stays hidden in all three cases.
 */
export function useAlertOwnershipLabelValues(enabled: boolean): Array<ComboboxOption<string>> {
  // Read at render time (not module scope) so tests can vary the config.
  const datasourceConfigured = Boolean(config.unifiedAlerting.stateHistory?.prometheusTargetDatasourceUID);
  const shouldFetch = enabled && datasourceConfigured;

  // Fetched once per mount; the label-value set changes slowly enough that
  // client-side filtering over it covers the search box.
  const { value, loading, error } = useAsync(async () => {
    if (!shouldFetch) {
      return NO_VALUES;
    }
    const range = rangeUtil.convertRawToRange(OWNERSHIP_VALUES_TIME_RANGE);
    const perKey = await Promise.all(
      HOME_ALERT_OWNERSHIP_LABEL_KEYS.map(async (key: OwnershipLabelKey) => {
        const values = await fetchTagValues(range, key);
        const group = ownershipLabelGroup(key);
        return values.map((v) => {
          const labelValue = String(v.value ?? v.text);
          return {
            label: labelValue,
            value: encodeAlertFilter({ slug: key, value: labelValue }),
            group,
          };
        });
      })
    );
    return perKey.flat();
  }, [shouldFetch]);

  return loading || error ? NO_VALUES : (value ?? NO_VALUES);
}
