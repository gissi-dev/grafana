import { useAsync } from 'react-use';

import { rangeUtil } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { type ComboboxOption } from '@grafana/ui';
import { fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import { ALERT_OWNERSHIP_KEYS, type AlertOwnershipKey, encodeAlertLabel } from './teamFilter';

const LABEL_VALUES_TIME_RANGE = { from: 'now-7d', to: 'now' };
// Stable so the combobox's sort memo doesn't rerun on every render while hidden.
const NO_VALUES: Array<ComboboxOption<string>> = [];

// Group headers. A single key (most orgs only have `team`) has its header stripped by the combobox.
function ownershipGroupLabel(key: AlertOwnershipKey): string {
  switch (key) {
    case 'team':
      return t('home.alerts-incidents.ownership-label-team', 'Team');
    case 'squad':
      return t('home.alerts-incidents.ownership-label-squad', 'Squad');
    case 'owner':
      return t('home.alerts-incidents.ownership-label-owner', 'Owner');
  }
}

/**
 * Values of the ownership labels (`team`, `squad`, `owner`) seen on alerts over the
 * last 7 days, from the state-history Prometheus datasource — that's what the
 * alertmanager matcher actually filters on, not Grafana org teams. Each value is
 * grouped under its label and selects the encoded `key:value`. A key that errors
 * or has no values is dropped. Empty while loading, or when every key is empty
 * or the datasource isn't configured, so the dropdown stays hidden.
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
    const timeRange = rangeUtil.convertRawToRange(LABEL_VALUES_TIME_RANGE);
    const perKey = await Promise.all(
      ALERT_OWNERSHIP_KEYS.map(async (key) => {
        try {
          const values = await fetchTagValues(timeRange, key);
          return values.flatMap((entry) => {
            const labelValue = String(entry.value ?? entry.text ?? '');
            if (!labelValue) {
              return [];
            }
            return [
              {
                label: labelValue,
                value: encodeAlertLabel({ key, value: labelValue }),
                group: ownershipGroupLabel(key),
              },
            ];
          });
        } catch {
          // One label's lookup failing shouldn't hide the keys that succeeded.
          return [];
        }
      })
    );
    return perKey.flat();
  }, [shouldFetch]);

  return loading || error ? NO_VALUES : (value ?? NO_VALUES);
}
