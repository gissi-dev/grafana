import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * The homepage alerts ownership filter selection. '' is the default scope ("your teams"
 * for team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick.
 * A bare string is a `team` label value, which is what localStorage already stores.
 * `squad:` and `owner:` (split on the first colon) name those labels instead.
 * A plain string so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "All teams" / "All alerts" pick; never a real label value. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

/** Alert labels the homepage dropdown is allowed to filter on. */
export const OWNERSHIP_LABEL_KEYS = ['team', 'squad', 'owner'] as const;
export type OwnershipLabelKey = (typeof OWNERSHIP_LABEL_KEYS)[number];

// `team` stays unprefixed so a previously stored team name still resolves as `team`.
const PREFIXED_OWNERSHIP_KEYS = ['squad', 'owner'] as const satisfies readonly OwnershipLabelKey[];

type TeamScope = { kind: 'default' } | { kind: 'all' } | { kind: 'label'; key: OwnershipLabelKey; value: string };

/** Selection string for one ownership label value. Team values stay bare. */
export function encodeAlertFilter(key: OwnershipLabelKey, value: string): TeamSelection {
  if (key === 'team') {
    return value;
  }
  return `${key}:${value}`;
}

/** The label value to show for a selection, never the `squad:` / `owner:` prefix. */
export function alertFilterLabel(selection: TeamSelection): string {
  const scope = resolveTeamScope(selection);
  return scope.kind === 'label' ? scope.value : selection;
}

export function resolveTeamScope(selection: TeamSelection): TeamScope {
  if (selection === ALL_TEAMS) {
    return { kind: 'all' };
  }
  if (!selection) {
    return { kind: 'default' };
  }
  for (const key of PREFIXED_OWNERSHIP_KEYS) {
    const prefix = `${key}:`;
    // An empty value after the prefix is not a real pick; keep it as a team name.
    if (selection.startsWith(prefix) && selection.length > prefix.length) {
      return { kind: 'label', key, value: selection.slice(prefix.length) };
    }
  }
  return { kind: 'label', key: 'team', value: selection };
}
