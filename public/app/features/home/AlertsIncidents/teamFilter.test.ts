import { ALL_TEAMS, alertFilterLabel, resolveTeamScope } from './teamFilter';

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    { selection: 'platform', expected: { kind: 'label', label: 'team', value: 'platform' } },
    { selection: 'squad:frontend', expected: { kind: 'label', label: 'squad', value: 'frontend' } },
    { selection: 'url:https://example.com', expected: { kind: 'label', label: 'url', value: 'https://example.com' } },
  ])('resolves "$selection" to $expected.kind', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });
});

describe('alertFilterLabel', () => {
  it.each([
    { selection: 'squad:frontend', label: 'frontend' },
    { selection: 'platform', label: 'platform' },
    { selection: 'url:https://example.com', label: 'https://example.com' },
  ])('shows "$label" for "$selection"', ({ selection, label }) => {
    expect(alertFilterLabel(selection)).toBe(label);
  });
});
