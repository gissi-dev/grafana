import {
  ALL_TEAMS,
  alertFilterLabel,
  decodeAlertFilter,
  encodeAlertFilter,
  ownershipLabelGroup,
  resolveTeamScope,
} from './teamFilter';

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    { selection: 'platform', expected: { kind: 'team', team: 'platform' } },
    { selection: 'squad:Frontend', expected: { kind: 'team', team: 'squad:Frontend' } },
  ])('resolves "$selection" to $expected.kind', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });
});

describe('alert filter selection', () => {
  it('round-trips a label value through the stored selection', () => {
    const filter = { slug: 'squad', value: 'Frontend' };
    expect(decodeAlertFilter(encodeAlertFilter(filter))).toEqual(filter);
  });

  it.each([
    // Only the first colon separates: the value keeps any of its own.
    { selection: 'team:Ops: EU', expected: { slug: 'team', value: 'Ops: EU' } },
    // Legacy plain team names (pre-encoding) become team:<name>.
    { selection: 'platform', expected: { slug: 'team', value: 'platform' } },
    // Default and all-teams scopes are not label picks.
    { selection: '', expected: undefined },
    { selection: ALL_TEAMS, expected: undefined },
  ])('decodes "$selection"', ({ selection, expected }) => {
    expect(decodeAlertFilter(selection)).toEqual(expected);
  });

  it('shows the value for display, not the encoded slug:value', () => {
    expect(alertFilterLabel('squad:Frontend')).toBe('Frontend');
    expect(alertFilterLabel('platform')).toBe('platform');
    expect(alertFilterLabel('')).toBe('');
  });

  it('capitalizes ownership keys for group headers', () => {
    expect(ownershipLabelGroup('team')).toBe('Team');
    expect(ownershipLabelGroup('squad')).toBe('Squad');
    expect(ownershipLabelGroup('owner')).toBe('Owner');
  });
});
