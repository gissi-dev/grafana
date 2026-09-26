import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertLabels } from './AlertLabels';

describe('AlertLabels', () => {
  it('should toggle show / hide common labels', async () => {
    const labels = { foo: 'bar', bar: 'baz', baz: 'qux' };
    const another = { foo: 'bar', baz: 'qux', extra: 'z' };

    render(<AlertLabels labels={labels} displayCommonLabels labelSets={[labels, another]} />);
    expect(screen.getByText('+2 common labels')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Hide common labels')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('+2 common labels')).toBeInTheDocument();
    });
  });

  it('shows priority keys first and collapses the rest behind other labels', async () => {
    const labels = { severity: 'critical', job: 'api', instance: 'pod-1', region: 'eu' };

    render(<AlertLabels labels={labels} priorityKeys={['severity', 'job']} />);

    expect(screen.getByText(/severity/)).toBeInTheDocument();
    expect(screen.getByText(/job/)).toBeInTheDocument();
    expect(screen.queryByText(/instance/)).not.toBeInTheDocument();
    expect(screen.getByText('+2 other labels')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('other-labels-expand'));
    expect(screen.getByText(/instance/)).toBeInTheDocument();
    expect(screen.getByText(/region/)).toBeInTheDocument();
    expect(screen.getByText('Hide other labels')).toBeInTheDocument();
  });

  it('keeps priority keys visible even when they are common across the set', () => {
    const a = { severity: 'critical', job: 'api', region: 'eu' };
    const b = { severity: 'critical', job: 'api', region: 'us' };

    render(<AlertLabels labels={a} displayCommonLabels labelSets={[a, b]} priorityKeys={['severity']} />);

    expect(screen.getByText(/severity/)).toBeInTheDocument();
    // severity is prioritized so it stays out of the common bucket; job is the only common left
    expect(screen.getByText('+1 common labels')).toBeInTheDocument();
  });

  it('shows all labels when priorityKeys is empty', () => {
    const labels = { severity: 'critical', job: 'api' };

    render(<AlertLabels labels={labels} />);

    expect(screen.getByText(/severity/)).toBeInTheDocument();
    expect(screen.getByText(/job/)).toBeInTheDocument();
    expect(screen.queryByText(/other labels/)).not.toBeInTheDocument();
  });
});
