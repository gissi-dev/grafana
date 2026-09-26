import { useStyles2 } from '@grafana/ui';
import { prometheusRuleType } from 'app/features/alerting/unified/utils/rules';

import { GRAFANA_RULES_SOURCE_NAME } from '../../../../features/alerting/unified/utils/datasource';
import { type AlertInstanceTotalState, type CombinedRuleWithLocation } from '../../../../types/unified-alerting';
import { AlertInstances } from '../AlertInstances';
import { getStyles } from '../UnifiedAlertList';
import { type UnifiedAlertListOptions } from '../types';

import { AlertRuleHeader } from './AlertRuleHeader';

type Props = {
  rules: CombinedRuleWithLocation[];
  options: UnifiedAlertListOptions;
  handleInstancesLimit?: (limit: boolean) => void;
  limitInstances: boolean;
  hideViewRuleLinkText?: boolean;
};

function getGrafanaInstancesTotal(totals: Partial<Record<AlertInstanceTotalState, number>>) {
  return Object.values(totals)
    .filter((total) => total !== undefined)
    .reduce((total, currentTotal) => total + currentTotal, 0);
}

const UngroupedModeView = ({ rules, options, handleInstancesLimit, limitInstances, hideViewRuleLinkText }: Props) => {
  const styles = useStyles2(getStyles);

  const rulesToDisplay = rules.length <= options.maxItems ? rules : rules.slice(0, options.maxItems);

  return (
    <ol className={styles.alertRuleList}>
      {rulesToDisplay.map((ruleWithLocation, index) => {
        const { namespaceName, groupName } = ruleWithLocation;
        const alertingRule = prometheusRuleType.alertingRule(ruleWithLocation.promRule)
          ? ruleWithLocation.promRule
          : undefined;

        if (!alertingRule) {
          return null;
        }

        const grafanaInstancesTotal =
          ruleWithLocation.dataSourceName === GRAFANA_RULES_SOURCE_NAME
            ? getGrafanaInstancesTotal(ruleWithLocation.instanceTotals)
            : undefined;
        const grafanaFilteredInstancesTotal =
          ruleWithLocation.dataSourceName === GRAFANA_RULES_SOURCE_NAME
            ? getGrafanaInstancesTotal(ruleWithLocation.filteredInstanceTotals)
            : undefined;

        return (
          <li
            className={styles.alertRuleItem}
            key={`alert-${namespaceName}-${groupName}-${ruleWithLocation.name}-${index}`}
          >
            <AlertRuleHeader rule={ruleWithLocation} hideViewRuleLinkText={hideViewRuleLinkText}>
              <AlertInstances
                rule={ruleWithLocation}
                alerts={alertingRule.alerts ?? []}
                options={options}
                grafanaTotalInstances={grafanaInstancesTotal}
                grafanaFilteredInstancesTotal={grafanaFilteredInstancesTotal}
                handleInstancesLimit={handleInstancesLimit}
                limitInstances={limitInstances}
              />
            </AlertRuleHeader>
          </li>
        );
      })}
    </ol>
  );
};

export default UngroupedModeView;
