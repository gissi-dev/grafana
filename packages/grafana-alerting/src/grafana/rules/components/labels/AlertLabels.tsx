import { css } from '@emotion/css';
import { chain } from 'lodash';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Stack, Toggletip, useStyles2 } from '@grafana/ui';

import { findCommonLabels, isPrivateLabel } from '../../utils/labels';

import { AlertLabel, type LabelSize } from './AlertLabel';

export interface AlertLabelsProps {
  labels: Record<string, string>;
  displayCommonLabels?: boolean;
  labelSets?: Array<Record<string, string>>;
  size?: LabelSize;
  onClick?: ([value, key]: [string | undefined, string | undefined]) => void;
  commonLabelsMode?: 'expand' | 'tooltip';
  /**
   * Label keys to show first. When set, those keys are never folded into the common-label
   * bucket, and any remaining non-priority labels collapse behind "+ N other labels".
   * Empty / undefined keeps the default label display.
   */
  priorityKeys?: string[];
}

export const AlertLabels = ({
  labels,
  displayCommonLabels,
  labelSets,
  size,
  onClick,
  commonLabelsMode = 'expand',
  priorityKeys,
}: AlertLabelsProps) => {
  const styles = useStyles2(getStyles, size);
  const [showCommonLabels, setShowCommonLabels] = useState(false);
  const [showOtherLabels, setShowOtherLabels] = useState(false);

  const priorityKeySet = useMemo(() => new Set(priorityKeys?.filter(Boolean) ?? []), [priorityKeys]);
  const hasPriorityKeys = priorityKeySet.size > 0;

  const computedCommonLabels = useMemo(() => {
    if (!displayCommonLabels || !Array.isArray(labelSets) || labelSets.length <= 1) {
      return {};
    }
    const common = findCommonLabels(labelSets);
    if (!hasPriorityKeys) {
      return common;
    }
    // Priority keys stay visible even when they are common across the set.
    return Object.fromEntries(Object.entries(common).filter(([key]) => !priorityKeySet.has(key)));
  }, [displayCommonLabels, labelSets, hasPriorityKeys, priorityKeySet]);

  const { priorityPairs, otherPairs, labelsToShow } = useMemo(() => {
    const nonPrivate = chain(labels).toPairs().reject(isPrivateLabel).value();

    if (!hasPriorityKeys) {
      const visible = nonPrivate.filter(([key]) => (showCommonLabels ? true : !(key in computedCommonLabels)));
      return { priorityPairs: [] as Array<[string, string]>, otherPairs: [] as Array<[string, string]>, labelsToShow: visible };
    }

    const priorityOrder = priorityKeys ?? [];
    const priorityPairs = priorityOrder
      .map((key) => nonPrivate.find(([k]) => k === key))
      .filter((pair): pair is [string, string] => pair != null);

    const otherPairs = nonPrivate.filter(
      ([key]) => !priorityKeySet.has(key) && (showCommonLabels ? true : !(key in computedCommonLabels))
    );

    return {
      priorityPairs,
      otherPairs,
      labelsToShow: showOtherLabels ? [...priorityPairs, ...otherPairs] : priorityPairs,
    };
  }, [
    labels,
    hasPriorityKeys,
    priorityKeys,
    priorityKeySet,
    showCommonLabels,
    showOtherLabels,
    computedCommonLabels,
  ]);

  const commonLabelsCount = Object.keys(computedCommonLabels).length;
  const hasCommonLabels = commonLabelsCount > 0;
  const otherLabelsCount = otherPairs.length;
  const hasOtherLabels = hasPriorityKeys && otherLabelsCount > 0;
  const tooltip = t('alert-labels.button.show.tooltip', 'Show common labels');

  const commonLabelsTooltip = useMemo(
    () => (
      <Stack data-testid="common-labels-tooltip-content" role="list" direction="row" wrap="wrap" gap={1} width={48}>
        {Object.entries(computedCommonLabels).map(([label, value]) => (
          <AlertLabel key={label + value} size={size} labelKey={label} value={value} colorBy="key" role="listitem" />
        ))}
      </Stack>
    ),
    [computedCommonLabels, size]
  );

  return (
    <div className={styles.wrapper} role="list" aria-label={t('alerting.alert-labels.aria-label-labels', 'Labels')}>
      {labelsToShow.map(([label, value]) => {
        return (
          <AlertLabel
            key={label + value}
            size={size}
            labelKey={label}
            value={value}
            colorBy="key"
            onClick={onClick}
            role="listitem"
          />
        );
      })}

      {hasOtherLabels && !showOtherLabels && (
        <div role="listitem">
          <Button
            variant="secondary"
            fill="text"
            onClick={() => setShowOtherLabels(true)}
            size="sm"
            data-testid="other-labels-expand"
          >
            <Trans
              i18nKey="alerting.alert-labels.other-labels-count"
              count={otherLabelsCount}
              tOptions={{
                defaultValue_one: '+{{count}} other labels',
                defaultValue_other: '+{{count}} other labels',
              }}
            >
              +{'{{count}}'} other labels
            </Trans>
          </Button>
        </div>
      )}
      {hasOtherLabels && showOtherLabels && (
        <div role="listitem">
          <Button variant="secondary" fill="text" onClick={() => setShowOtherLabels(false)} size="sm">
            <Trans i18nKey="alert-labels.button.hide-other">Hide other labels</Trans>
          </Button>
        </div>
      )}

      {!showCommonLabels && hasCommonLabels && (
        <div role="listitem">
          {commonLabelsMode === 'expand' ? (
            <Button
              variant="secondary"
              fill="text"
              onClick={() => setShowCommonLabels(true)}
              tooltip={tooltip}
              tooltipPlacement="top"
              size="sm"
            >
              <Trans
                i18nKey="alerting.alert-labels.common-labels-count"
                count={commonLabelsCount}
                tOptions={{
                  defaultValue_one: '+{{count}} common labels',
                  defaultValue_other: '+{{count}} common labels',
                }}
              >
                +{'{{count}}'} common labels
              </Trans>
            </Button>
          ) : (
            <Toggletip content={commonLabelsTooltip} closeButton={false} fitContent={true}>
              <Button data-testid="common-labels-tooltip-trigger" variant="secondary" fill="text" size="sm">
                <Trans
                  i18nKey="alerting.alert-labels.common-labels-count"
                  count={commonLabelsCount}
                  tOptions={{
                    defaultValue_one: '+{{count}} common labels',
                    defaultValue_other: '+{{count}} common labels',
                  }}
                >
                  +{'{{count}}'} common labels
                </Trans>
              </Button>
            </Toggletip>
          )}
        </div>
      )}
      {showCommonLabels && hasCommonLabels && (
        <div role="listitem">
          <Button
            variant="secondary"
            fill="text"
            onClick={() => setShowCommonLabels(false)}
            tooltipPlacement="top"
            size="sm"
          >
            <Trans i18nKey="alert-labels.button.hide">Hide common labels</Trans>
          </Button>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, size?: LabelSize) => {
  return {
    wrapper: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',

      gap: size === 'md' ? theme.spacing() : theme.spacing(0.5),
    }),
  };
};
