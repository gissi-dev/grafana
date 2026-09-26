import { useMemo } from 'react';

import { t } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';
import { AlertLabel } from 'app/features/alerting/unified/components/AlertLabel';
import { getAlertingRule } from 'app/features/alerting/unified/utils/rules';
import { type Alert } from 'app/types/unified-alerting';

import { type CombinedRuleWithLocation } from '../../../../types/unified-alerting';
import { AlertInstances } from '../AlertInstances';
import { getStyles } from '../UnifiedAlertList';
import { CustomGroupLayout, type UnifiedAlertListOptions } from '../types';
import { filterAlerts } from '../util';

import { AlertRuleHeader } from './AlertRuleHeader';

type Props = {
  rules: CombinedRuleWithLocation[];
  options: UnifiedAlertListOptions;
};

type LabelGroup = {
  key: string;
  alerts: Alert[];
  rules: CombinedRuleWithLocation[];
};

type RuleWithLabelGroups = {
  rule: CombinedRuleWithLocation;
  groups: LabelGroup[];
};

export const UNGROUPED_KEY = '__ungrouped__';

function createMapKey(groupBy: string[], labels: Record<string, string>): string {
  return new URLSearchParams(groupBy.map((key) => [key, labels[key]])).toString();
}

function parseMapKey(key: string): Array<[string, string]> {
  return [...new URLSearchParams(key)];
}

function alertHasEveryLabelForCombinedRules(rule: CombinedRuleWithLocation, groupByKeys: string[]) {
  const alertingRule = getAlertingRule(rule);
  return groupByKeys.every((key) => {
    return (alertingRule?.alerts ?? []).some((alert) => alert.labels[key]);
  });
}

function addAlertToFlatGroup(
  map: Map<string, LabelGroup>,
  mapKey: string,
  alert: Alert,
  rule: CombinedRuleWithLocation
) {
  const existing = map.get(mapKey);
  if (existing) {
    existing.alerts.push(alert);
    if (!existing.rules.some((r) => r === rule || (r.name === rule.name && r.namespaceName === rule.namespaceName))) {
      existing.rules.push(rule);
    }
  } else {
    map.set(mapKey, { key: mapKey, alerts: [alert], rules: [rule] });
  }
}

function buildFlatGroups(rules: CombinedRuleWithLocation[], groupBy: string[], options: UnifiedAlertListOptions) {
  const grouped = new Map<string, LabelGroup>();

  rules.forEach((rule) => {
    const alertingRule = getAlertingRule(rule);
    const hasInstancesMatching = groupBy ? alertHasEveryLabelForCombinedRules(rule, groupBy) : true;

    (alertingRule?.alerts ?? []).forEach((alert) => {
      const mapKey = hasInstancesMatching ? createMapKey(groupBy, alert.labels) : UNGROUPED_KEY;
      addAlertToFlatGroup(grouped, mapKey, alert, rule);
    });
  });

  const ungrouped = grouped.get(UNGROUPED_KEY);
  grouped.delete(UNGROUPED_KEY);
  if (ungrouped && ungrouped.alerts.length > 0) {
    grouped.set(UNGROUPED_KEY, ungrouped);
  }

  const result: LabelGroup[] = [];
  for (const group of grouped.values()) {
    const filtered = filterAlerts(options, group.alerts);
    if (filtered.length > 0) {
      result.push({ ...group, alerts: filtered });
    }
  }
  return result;
}

function buildByRuleGroups(rules: CombinedRuleWithLocation[], groupBy: string[], options: UnifiedAlertListOptions) {
  const result: RuleWithLabelGroups[] = [];

  rules.forEach((rule) => {
    const alertingRule = getAlertingRule(rule);
    if (!alertingRule) {
      return;
    }

    const hasInstancesMatching = groupBy ? alertHasEveryLabelForCombinedRules(rule, groupBy) : true;
    const groups = new Map<string, LabelGroup>();

    (alertingRule.alerts ?? []).forEach((alert) => {
      const mapKey = hasInstancesMatching ? createMapKey(groupBy, alert.labels) : UNGROUPED_KEY;
      addAlertToFlatGroup(groups, mapKey, alert, rule);
    });

    const ungrouped = groups.get(UNGROUPED_KEY);
    groups.delete(UNGROUPED_KEY);
    if (ungrouped && ungrouped.alerts.length > 0) {
      groups.set(UNGROUPED_KEY, ungrouped);
    }

    const filteredGroups: LabelGroup[] = [];
    for (const group of groups.values()) {
      const filtered = filterAlerts(options, group.alerts);
      if (filtered.length > 0) {
        filteredGroups.push({ ...group, alerts: filtered });
      }
    }

    if (filteredGroups.length > 0) {
      result.push({ rule, groups: filteredGroups });
    }
  });

  return result;
}

function GroupingLabelChips({ groupKey }: { groupKey: string }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.customGroupDetails}>
      <div className={styles.alertLabels}>
        {groupKey !== UNGROUPED_KEY &&
          parseMapKey(groupKey).map(([key, value]) => <AlertLabel key={key} labelKey={key} value={value} />)}
        {groupKey === UNGROUPED_KEY && t('alertlist.grouped-view.no-grouping', 'No grouping')}
      </div>
    </div>
  );
}

function FlatGroupHeader({ rules }: { rules: CombinedRuleWithLocation[] }) {
  const styles = useStyles2(getStyles);
  const names = rules.map((r) => r.name);
  const uniqueNames = [...new Set(names)];

  if (uniqueNames.length === 1 && rules[0]) {
    return (
      <div className={styles.instanceDetails}>
        <div className={styles.alertName} title={uniqueNames[0]}>
          {uniqueNames[0]}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.instanceDetails}>
      <div className={styles.alertName} title={uniqueNames.join(', ')}>
        {t('alertlist.grouped-view.multiple-rules', '{{count}} rules', { count: uniqueNames.length })}:{' '}
        {uniqueNames.join(', ')}
      </div>
    </div>
  );
}

const GroupedModeView = ({ rules, options }: Props) => {
  const styles = useStyles2(getStyles);
  const groupBy = options.groupBy;
  const layout = options.customGroupLayout ?? CustomGroupLayout.ByRule;

  const byRuleGroups = useMemo(
    () => (layout === CustomGroupLayout.ByRule ? buildByRuleGroups(rules, groupBy, options) : []),
    [layout, rules, groupBy, options]
  );

  const flatGroups = useMemo(
    () => (layout === CustomGroupLayout.Flat ? buildFlatGroups(rules, groupBy, options) : []),
    [layout, rules, groupBy, options]
  );

  if (layout === CustomGroupLayout.ByRule) {
    return (
      <ol className={styles.alertRuleList}>
        {byRuleGroups.map(({ rule, groups }) => (
          <li
            className={styles.alertRuleItem}
            key={`${rule.namespaceName}-${rule.groupName}-${rule.name}`}
            data-testid={`rule-${rule.name}`}
          >
            <AlertRuleHeader rule={rule}>
              {groups.map((group) => (
                <div key={group.key} data-testid={group.key}>
                  <GroupingLabelChips groupKey={group.key} />
                  <AlertInstances rule={rule} alerts={group.alerts} options={options} />
                </div>
              ))}
            </AlertRuleHeader>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={styles.alertRuleList}>
      {flatGroups.map((group) => (
        <li className={styles.alertRuleItem} key={group.key} data-testid={group.key}>
          <div className={styles.alertNameWrapper}>
            <FlatGroupHeader rules={group.rules} />
            <GroupingLabelChips groupKey={group.key} />
            <AlertInstances rule={group.rules[0]} alerts={group.alerts} options={options} />
          </div>
        </li>
      ))}
    </ol>
  );
};

export default GroupedModeView;
