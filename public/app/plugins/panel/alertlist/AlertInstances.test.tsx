import { render, screen } from 'test/test-utils';
import userEvent from '@testing-library/user-event';

import { mockPromAlert } from 'app/features/alerting/unified/mocks';
import { BigValueColorMode } from '@grafana/ui';

import { AlertInstances } from './AlertInstances';
import {
  CustomGroupLayout,
  GroupMode,
  SortOrder,
  STAT_THRESHOLDS_DEFAULT,
  type UnifiedAlertListOptions,
  ViewMode,
} from './types';

function makeOptions(overrides: Partial<UnifiedAlertListOptions> = {}): UnifiedAlertListOptions {
  return {
    maxItems: 20,
    sortOrder: SortOrder.AlphaAsc,
    dashboardAlerts: false,
    groupMode: GroupMode.Custom,
    groupBy: ['job'],
    customGroupLayout: CustomGroupLayout.ByRule,
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

describe('AlertInstances', () => {
  const alerts = [mockPromAlert({ labels: { job: 'api', severity: 'critical' } })];

  it('starts collapsed when showInstances is false, including in custom group mode', () => {
    render(<AlertInstances alerts={alerts} options={makeOptions({ showInstances: false })} />);

    expect(screen.getByText(/1 instance/)).toBeInTheDocument();
    expect(screen.queryByText('Labels')).not.toBeInTheDocument();
  });

  it('starts expanded when showInstances is true', () => {
    render(<AlertInstances alerts={alerts} options={makeOptions({ showInstances: true })} />);

    expect(screen.getByText(/1 instance/)).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
  });

  it('toggles the instance table when the collapse control is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertInstances alerts={alerts} options={makeOptions({ showInstances: false })} />);

    await user.click(screen.getByText(/1 instance/));
    expect(screen.getByText('Labels')).toBeInTheDocument();

    await user.click(screen.getByText(/1 instance/));
    expect(screen.queryByText('Labels')).not.toBeInTheDocument();
  });
});
