import { useMemo } from 'react';
import { useAsync } from 'react-use';

import { rangeUtil } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { type ComboboxOption } from '@grafana/ui';
import { fetchTagValues } from 'app/features/alerting/unified/triage/scene/tagKeysProviders';

import { OWNERSHIP_LABEL_KEYS, type OwnershipLabelKey, encodeAlertFilter } from './teamFilter';

const TEAM_VALUES_TIME_RANGE = { from: 'now-7d', to: 'now' };
// Stable so the combobox's sort memo doesn't rerun on every render while hidden.
const NO_VALUES: Array<ComboboxOption<string>> = [];

type OwnershipValue = { key: OwnershipLabelKey; label: string };

/**
 * Values of the ownership labels (`team`, `squad`, `owner`) seen on alerts over the
 * last 7 days, from the state-history Prometheus datasource — that's what the
 * alertmanager matcher actually filters on, not Grafana org teams. Shaped for the
 * alerts dropdown: the visible label is the raw value, the selection is encoded,
 * and `group` names the label key. A key that fails or has no values is omitted
 * so the others still show. Empty while loading, when every key fails, or when
 * the datasource isn't configured, so the dropdown stays hidden in those cases.
 */
export function useAlertTeamLabelValues(enabled: boolean): Array<ComboboxOption<string>> {
  // Read at render time (not module scope) so tests can vary the config.
  const datasourceConfigured = Boolean(config.unifiedAlerting.stateHistory?.prometheusTargetDatasourceUID);
  const shouldFetch = enabled && datasourceConfigured;

  // Fetched once per mount; the label-value set changes slowly enough that
  // client-side filtering over it covers the search box.
  const { value, loading, error } = useAsync(async () => {
    if (!shouldFetch) {
      return [] satisfies OwnershipValue[];
    }
    const range = rangeUtil.convertRawToRange(TEAM_VALUES_TIME_RANGE);
    const groups = await Promise.all(
      OWNERSHIP_LABEL_KEYS.map(async (key) => {
        try {
          const values = await fetchTagValues(range, key);
          return values.flatMap((entry) => {
            const label = String(entry.value ?? entry.text);
            return label ? [{ key, label }] : [];
          });
        } catch {
          // One key's failure must not drop the values of the others.
          return [];
        }
      })
    );
    return groups.flat();
  }, [shouldFetch]);

  const teamGroup = t('home.alerts-incidents.ownership-group-team', 'Team');
  const squadGroup = t('home.alerts-incidents.ownership-group-squad', 'Squad');
  const ownerGroup = t('home.alerts-incidents.ownership-group-owner', 'Owner');

  return useMemo(() => {
    if (loading || error || !value?.length) {
      return NO_VALUES;
    }
    const groupLabel: Record<OwnershipLabelKey, string> = {
      team: teamGroup,
      squad: squadGroup,
      owner: ownerGroup,
    };
    return value.map(({ key, label }) => ({
      label,
      value: encodeAlertFilter(key, label),
      group: groupLabel[key],
    }));
  }, [loading, error, value, teamGroup, squadGroup, ownerGroup]);
}
