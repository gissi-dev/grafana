import { css, cx } from '@emotion/css';
import { type ReactNode } from 'react';
import { useLocation } from 'react-use';

import { type GrafanaTheme2, intervalToAbbreviatedDurationString } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Icon, TextLink, Stack, useStyles2 } from '@grafana/ui';
import alertDef from 'app/features/alerting/state/alertDef';
import { Spacer } from 'app/features/alerting/unified/components/Spacer';
import { fromCombinedRule, stringifyIdentifier } from 'app/features/alerting/unified/utils/rule-id';
import {
  alertStateToReadable,
  alertStateToState,
  getFirstActiveAt,
  prometheusRuleType,
} from 'app/features/alerting/unified/utils/rules';
import { createRelativeUrl } from 'app/features/alerting/unified/utils/url';
import { PromAlertingRuleState } from 'app/types/unified-alerting-dto';

import { type CombinedRuleWithLocation } from '../../../../types/unified-alerting';
import { getStyles } from '../UnifiedAlertList';

type Props = {
  rule: CombinedRuleWithLocation;
  hideViewRuleLinkText?: boolean;
  /** Content under the rule header (e.g. instance table or label subgroups). */
  children?: ReactNode;
};

/**
 * Rule name, state, duration, and view-rule link — shared by default and custom grouping.
 * Children render inside the name column under the header.
 */
export function AlertRuleHeader({ rule, hideViewRuleLinkText, children }: Props) {
  const styles = useStyles2(getStyles);
  const stateStyle = useStyles2(getStateTagStyles);
  const { href: returnTo } = useLocation();

  const alertingRule = prometheusRuleType.alertingRule(rule.promRule) ? rule.promRule : undefined;
  if (!alertingRule) {
    return null;
  }

  const firstActiveAt = getFirstActiveAt(alertingRule);
  const identifier = fromCombinedRule(rule.dataSourceName, rule);
  const href = createRelativeUrl(
    `/alerting/${encodeURIComponent(rule.dataSourceName)}/${encodeURIComponent(stringifyIdentifier(identifier))}/view`,
    { returnTo: returnTo ?? '' }
  );

  return (
    <>
      <div className={stateStyle.icon}>
        <Icon
          name={alertDef.getStateDisplayModel(alertingRule.state).iconClass}
          className={stateStyle[alertStateToState(alertingRule.state)]}
          size={'lg'}
        />
      </div>
      <div className={styles.alertNameWrapper}>
        <div className={styles.instanceDetails}>
          <Stack direction="row" gap={1}>
            <div className={styles.alertName} title={rule.name}>
              {rule.name}
            </div>
            <Spacer />
            {href && (
              <TextLink
                href={href}
                external={true}
                inline={false}
                aria-label={t('alertlist.ungrouped-mode-view.aria-label-view-alert-rule', 'View alert rule')}
              >
                <span className={cx({ [styles.hidden]: hideViewRuleLinkText })}>
                  <Trans i18nKey="alertlist.ungrouped-mode-view.view-alert-rule">View alert rule</Trans>
                </span>
              </TextLink>
            )}
          </Stack>
          <div className={styles.alertDuration}>
            <span className={stateStyle[alertStateToState(alertingRule.state)]}>
              {alertStateToReadable(alertingRule.state)}
            </span>{' '}
            {firstActiveAt && alertingRule.state !== PromAlertingRuleState.Inactive && (
              <Trans
                i18nKey="alertlist.ungrouped-mode-view.active-for"
                values={{
                  duration: intervalToAbbreviatedDurationString({ start: firstActiveAt, end: Date.now() }),
                }}
              >
                for <span>{'{{duration}}'}</span>
              </Trans>
            )}
          </div>
        </div>
        {children}
      </div>
    </>
  );
}

const getStateTagStyles = (theme: GrafanaTheme2) => ({
  icon: css({
    marginTop: theme.spacing(2.5),
    alignSelf: 'flex-start',
  }),
  good: css({
    color: theme.colors.success.main,
  }),
  bad: css({
    color: theme.colors.error.main,
  }),
  warning: css({
    color: theme.colors.warning.main,
  }),
  neutral: css({
    color: theme.colors.secondary.main,
  }),
  info: css({
    color: theme.colors.primary.main,
  }),
});
