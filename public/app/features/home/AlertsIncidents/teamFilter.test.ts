import { ALL_TEAMS, alertFilterLabel, encodeAlertFilter, resolveTeamScope } from './teamFilter';

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    { selection: 'platform', expected: { kind: 'label', key: 'team', value: 'platform' } },
    { selection: 'team:ops', expected: { kind: 'label', key: 'team', value: 'team:ops' } },
    { selection: 'squad:frontend', expected: { kind: 'label', key: 'squad', value: 'frontend' } },
    { selection: 'owner:alice:bob', expected: { kind: 'label', key: 'owner', value: 'alice:bob' } },
    { selection: 'squad:', expected: { kind: 'label', key: 'team', value: 'squad:' } },
  ])('resolves "$selection" to $expected.kind', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });
});

describe('encodeAlertFilter', () => {
  it('keeps a team value bare so a stored team name still matches', () => {
    expect(encodeAlertFilter('team', 'platform')).toBe('platform');
  });

  it('prefixes squad and owner so the key survives localStorage', () => {
    expect(encodeAlertFilter('squad', 'frontend')).toBe('squad:frontend');
    expect(encodeAlertFilter('owner', 'alice:bob')).toBe('owner:alice:bob');
  });
});

describe('alertFilterLabel', () => {
  it('shows the label value without the squad or owner prefix', () => {
    expect(alertFilterLabel('squad:frontend')).toBe('frontend');
    expect(alertFilterLabel('owner:alice:bob')).toBe('alice:bob');
    expect(alertFilterLabel('platform')).toBe('platform');
  });
});
