import { ALL_TEAMS, alertFilterLabel, decodeAlertLabel, encodeAlertLabel, resolveTeamScope } from './teamFilter';

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    { selection: 'platform', expected: { kind: 'team', team: 'platform' } },
    // The combobox value is the stored string, so an encoded pick stays encoded here.
    { selection: 'squad:Frontend', expected: { kind: 'team', team: 'squad:Frontend' } },
  ])('resolves "$selection" to $expected.kind', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });
});

describe('decodeAlertLabel', () => {
  it.each([
    { selection: '', expected: undefined },
    { selection: ALL_TEAMS, expected: undefined },
    { selection: 'platform', expected: { key: 'team', value: 'platform' } },
    { selection: 'squad:Frontend', expected: { key: 'squad', value: 'Frontend' } },
    // The first ':' separates the key; the rest of the string is the value.
    { selection: 'owner:acme:sre', expected: { key: 'owner', value: 'acme:sre' } },
    // An unknown key is a legacy team name that happens to contain ':'.
    { selection: 'region:us', expected: { key: 'team', value: 'region:us' } },
  ])('decodes "$selection"', ({ selection, expected }) => {
    expect(decodeAlertLabel(selection)).toEqual(expected);
  });

  it('encodes a pick the decoder can read back', () => {
    const encoded = encodeAlertLabel({ key: 'squad', value: 'Frontend' });
    expect(encoded).toBe('squad:Frontend');
    expect(decodeAlertLabel(encoded)).toEqual({ key: 'squad', value: 'Frontend' });
    expect(alertFilterLabel(encoded)).toBe('Frontend');
  });

  it('shows a legacy team name as itself', () => {
    expect(alertFilterLabel('platform')).toBe('platform');
  });
});
