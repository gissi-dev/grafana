import { useAsync } from 'react-use';

import { rangeUtil } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { type ComboboxOption } from '@grafana/ui';
import { fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import { OWNERSHIP_LABEL_KEYS, type OwnershipLabelKey, encodeOwnershipSelection } from './teamFilter';

const TEAM_VALUES_TIME_RANGE = { from: 'now-7d', to: 'now' };
// Stable so the combobox's sort memo doesn't rerun on every render while hidden.
const NO_VALUES: Array<ComboboxOption<string>> = [];

function ownershipGroupLabel(key: OwnershipLabelKey): string {
  switch (key) {
    case 'team':
      return t('home.alerts-incidents.ownership-group-team', 'Team');
    case 'squad':
      return t('home.alerts-incidents.ownership-group-squad', 'Squad');
    case 'owner':
      return t('home.alerts-incidents.ownership-group-owner', 'Owner');
  }
}

/**
 * Values of the ownership labels (`team`, `squad`, `owner`) seen on alerts over the
 * last 7 days, from the state-history Prometheus datasource — that's what the
 * alertmanager matcher actually filters on, not Grafana org teams. Each value is
 * grouped under its label and selects to the encoded `key:value`. Empty while
 * loading, on error, or when the datasource isn't configured, so the dropdown
 * stays hidden in all three cases. A label with no values is omitted.
 */
export function useAlertTeamLabelValues(enabled: boolean): Array<ComboboxOption<string>> {
  // Read at render time (not module scope) so tests can vary the config.
  const datasourceConfigured = Boolean(config.unifiedAlerting.stateHistory?.prometheusTargetDatasourceUID);
  const shouldFetch = enabled && datasourceConfigured;
  const groupLabels = {
    team: ownershipGroupLabel('team'),
    squad: ownershipGroupLabel('squad'),
    owner: ownershipGroupLabel('owner'),
  };

  // Fetched once per mount; the label-value set changes slowly enough that
  // client-side filtering over it covers the search box.
  const { value, loading, error } = useAsync(async () => {
    if (!shouldFetch) {
      return NO_VALUES;
    }
    const timeRange = rangeUtil.convertRawToRange(TEAM_VALUES_TIME_RANGE);
    const grouped = await Promise.all(
      OWNERSHIP_LABEL_KEYS.map(async (key) => {
        const values = await fetchTagValues(timeRange, key);
        return values.flatMap((entry) => {
          const label = String(entry.value ?? entry.text);
          if (!label) {
            return [];
          }
          return [{ label, value: encodeOwnershipSelection(key, label), group: groupLabels[key] }];
        });
      })
    );
    return grouped.flat();
  }, [shouldFetch, groupLabels.team, groupLabels.squad, groupLabels.owner]);

  return loading || error ? NO_VALUES : (value ?? NO_VALUES);
}
