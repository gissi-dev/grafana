import { ALL_TEAMS, encodeOwnershipSelection, ownershipFilterLabel, resolveTeamScope } from './teamFilter';

describe('resolveTeamScope', () => {
  it.each([
    { selection: '', expected: { kind: 'default' } },
    { selection: ALL_TEAMS, expected: { kind: 'all' } },
    // A bare string is a team label stored before ownership keys existed.
    { selection: 'platform', expected: { kind: 'label', key: 'team', value: 'platform' } },
    { selection: 'squad:frontend', expected: { kind: 'label', key: 'squad', value: 'frontend' } },
    { selection: 'owner:alice', expected: { kind: 'label', key: 'owner', value: 'alice' } },
    // A prefix that isn't an ownership key stays part of the team value.
    { selection: 'region:us', expected: { kind: 'label', key: 'team', value: 'region:us' } },
    // Only the first colon separates, so the value keeps any of its own.
    { selection: 'team:Ops: EU', expected: { kind: 'label', key: 'team', value: 'Ops: EU' } },
  ])('resolves "$selection"', ({ selection, expected }) => {
    expect(resolveTeamScope(selection)).toEqual(expected);
  });

  it('round-trips a value that contains a colon and shows only that value', () => {
    const selection = encodeOwnershipSelection('team', 'Ops: EU');
    expect(selection).toBe('team:Ops: EU');
    expect(resolveTeamScope(selection)).toEqual({ kind: 'label', key: 'team', value: 'Ops: EU' });
    expect(ownershipFilterLabel(selection)).toBe('Ops: EU');
    expect(ownershipFilterLabel('squad:frontend')).toBe('frontend');
    expect(ownershipFilterLabel('platform')).toBe('platform');
  });
});
