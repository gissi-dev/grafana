import { render, screen } from 'test/test-utils';

import { mockCombinedRule, mockPromAlert, mockPromAlertingRule, mockRulerGrafanaRule } from 'app/features/alerting/unified/mocks';
import { type CombinedRuleWithLocation } from 'app/types/unified-alerting';
import { BigValueColorMode } from '@grafana/ui';

import {
  CustomGroupLayout,
  GroupMode,
  SortOrder,
  STAT_THRESHOLDS_DEFAULT,
  type UnifiedAlertListOptions,
  ViewMode,
} from '../types';

import GroupedView, { UNGROUPED_KEY } from './GroupedView';

function makeOptions(overrides: Partial<UnifiedAlertListOptions> = {}): UnifiedAlertListOptions {
  return {
    maxItems: 20,
    sortOrder: SortOrder.AlphaAsc,
    dashboardAlerts: false,
    groupMode: GroupMode.Custom,
    groupBy: ['job', 'severity'],
    customGroupLayout: CustomGroupLayout.Flat,
    alertName: '',
    showInstances: false,
    priorityLabels: [],
    folder: { uid: '', title: '' },
    stateFilter: {} as UnifiedAlertListOptions['stateFilter'],
    alertInstanceLabelFilter: '',
    datasource: '',
    viewMode: ViewMode.List,
    showInactiveAlerts: false,
    statColorMode: BigValueColorMode.None,
    statThresholds: STAT_THRESHOLDS_DEFAULT,
    statValueMappings: [],
    ...overrides,
  };
}

function makeRule(name: string, alerts: ReturnType<typeof mockPromAlert>[]): CombinedRuleWithLocation {
  const combined = mockCombinedRule({
    name,
    promRule: mockPromAlertingRule({ name, alerts }),
    rulerRule: mockRulerGrafanaRule({}, { title: name, uid: `uid-${name}` }),
  });
  return {
    ...combined,
    dataSourceName: 'grafana',
    namespaceName: combined.namespace.name,
    groupName: combined.group.name,
  };
}

describe('Grouped view', () => {
  const rules: CombinedRuleWithLocation[] = [
    makeRule('cpu-high', [
      mockPromAlert({ labels: { job: 'job-1', severity: 'high' } }),
      mockPromAlert({ labels: { job: 'job-2', severity: 'low' } }),
    ]),
    makeRule('disk-full', [mockPromAlert({ labels: { foo: 'bar', severity: 'low' } })]),
  ];

  it('flat layout groups instances by label(s) across rules', () => {
    render(<GroupedView rules={rules} options={makeOptions({ customGroupLayout: CustomGroupLayout.Flat })} />);

    expect(screen.getByTestId('job=job-1&severity=high')).toHaveTextContent('cpu-high');
    expect(screen.getByTestId('job=job-2&severity=low')).toHaveTextContent('cpu-high');
    expect(screen.getByTestId(UNGROUPED_KEY)).toHaveTextContent('disk-full');
  });

  it('flat layout lists every contributing rule name when a group mixes rules', () => {
    const shared = [
      makeRule('rule-a', [mockPromAlert({ labels: { job: 'api', severity: 'high' } })]),
      makeRule('rule-b', [mockPromAlert({ labels: { job: 'api', severity: 'high' } })]),
    ];

    render(
      <GroupedView
        rules={shared}
        options={makeOptions({ customGroupLayout: CustomGroupLayout.Flat, groupBy: ['job', 'severity'] })}
      />
    );

    const group = screen.getByTestId('job=api&severity=high');
    expect(group).toHaveTextContent('2 rules');
    expect(group).toHaveTextContent('rule-a');
    expect(group).toHaveTextContent('rule-b');
  });

  it('by-rule layout keeps the rule name and subgroups by labels under it', () => {
    render(
      <GroupedView
        rules={rules}
        options={makeOptions({ customGroupLayout: CustomGroupLayout.ByRule, showInstances: false })}
      />
    );

    expect(screen.getByTestId('rule-cpu-high')).toBeInTheDocument();
    expect(screen.getByTestId('rule-cpu-high')).toHaveTextContent('cpu-high');
    expect(screen.getByTestId('job=job-1&severity=high')).toBeInTheDocument();
    expect(screen.getByTestId('job=job-2&severity=low')).toBeInTheDocument();

    // disk-full has no job label → ungrouped under that rule
    expect(screen.getByTestId('rule-disk-full')).toBeInTheDocument();
    expect(screen.getByTestId('rule-disk-full')).toHaveTextContent('disk-full');
  });

  it('shows a collapse control for custom groups instead of forcing instances open', () => {
    render(
      <GroupedView
        rules={[makeRule('cpu-high', [mockPromAlert({ labels: { job: 'job-1', severity: 'high' } })])]}
        options={makeOptions({ customGroupLayout: CustomGroupLayout.Flat, showInstances: false })}
      />
    );

    expect(screen.getByText(/1 instance/)).toBeInTheDocument();
    // Table headers only appear once the instance list is expanded
    expect(screen.queryByText('Labels')).not.toBeInTheDocument();
  });
});
