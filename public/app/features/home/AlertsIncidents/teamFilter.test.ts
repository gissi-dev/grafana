import {
  ALL_TEAMS,
  alertFilterLabel,
  decodeAlertFilter,
  encodeAlertFilter,
  resolveTeamScope,
} from './teamFilter';

describe('alert filter selection', () => {
  it('round-trips a label value through the stored selection', () => {
    const filter = { label: 'squad', value: 'Frontend' };
    expect(decodeAlertFilter(encodeAlertFilter(filter))).toEqual(filter);
  });

  it.each([
    // Only the first colon separates: the value keeps any of its own.
    { selection: 'team:Ops: EU', expected: { label: 'team', value: 'Ops: EU' } },
    // Legacy bare team names (pre-label-filter storage) decode as the team label.
    { selection: 'platform', expected: { label: 'team', value: 'platform' } },
    // '' and the org-wide sentinel are scopes, not a label pick.
    { selection: '', expected: undefined },
    { selection: ALL_TEAMS, expected: undefined },
  ])('decodes "$selection"', ({ selection, expected }) => {
    expect(decodeAlertFilter(selection)).toEqual(expected);
  });

  it('shows the value, not the encoded label:value', () => {
    expect(alertFilterLabel('squad:Frontend')).toBe('Frontend');
    expect(alertFilterLabel('platform')).toBe('platform');
  });
});

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    { selection: 'platform', expected: { kind: 'label', label: 'team', value: 'platform' } },
    { selection: 'squad:Frontend', expected: { kind: 'label', label: 'squad', value: 'Frontend' } },
  ])('resolves "$selection" to $expected.kind', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });
});
