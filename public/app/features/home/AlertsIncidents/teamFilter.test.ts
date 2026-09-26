import { ALL_TEAMS, encodeOwnershipFilter, ownershipFilterLabel, resolveTeamScope } from './teamFilter';

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    { selection: 'platform', expected: { kind: 'label', key: 'team', value: 'platform' } },
    { selection: 'squad:Frontend', expected: { kind: 'label', key: 'squad', value: 'Frontend' } },
    { selection: 'owner:Ops: EU', expected: { kind: 'label', key: 'owner', value: 'Ops: EU' } },
  ])('resolves "$selection" to $expected.kind', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });
});

describe('ownership filter encoding', () => {
  it('round-trips a squad value, including extra colons in the value', () => {
    expect(encodeOwnershipFilter('squad', 'Frontend')).toBe('squad:Frontend');
    expect(encodeOwnershipFilter('owner', 'Ops: EU')).toBe('owner:Ops: EU');
    expect(ownershipFilterLabel('squad:Frontend')).toBe('Frontend');
    expect(ownershipFilterLabel('owner:Ops: EU')).toBe('Ops: EU');
    expect(ownershipFilterLabel('platform')).toBe('platform');
  });
});
