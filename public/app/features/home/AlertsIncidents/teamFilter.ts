import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * Alert label keys the homepage dropdown offers. A short ownership allowlist:
 * alert labels are free-form and high cardinality, so this is not every label.
 */
export const OWNERSHIP_LABEL_KEYS = ['team', 'squad', 'owner'] as const;

export type OwnershipLabelKey = (typeof OWNERSHIP_LABEL_KEYS)[number];

/**
 * The homepage alerts filter selection. '' is the default scope ("your teams" for
 * team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick;
 * anything else names one ownership label value. New picks are `key:value`
 * (e.g. `squad:Frontend`). A bare name with no ':' is a legacy `team` value
 * left in localStorage. A plain string so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "All teams" / "All alerts" pick; never a real label value. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

// Label keys are identifiers, so the first ':' always separates key from value.
const FILTER_SEPARATOR = ':';

type TeamScope = { kind: 'default' } | { kind: 'all' } | { kind: 'label'; key: string; value: string };

export function encodeOwnershipFilter(key: OwnershipLabelKey, value: string): TeamSelection {
  return `${key}${FILTER_SEPARATOR}${value}`;
}

export function resolveTeamScope(selection: TeamSelection): TeamScope {
  if (selection === ALL_TEAMS) {
    return { kind: 'all' };
  }
  if (!selection) {
    return { kind: 'default' };
  }
  const separatorIndex = selection.indexOf(FILTER_SEPARATOR);
  // Stored before ownership keys existed: the whole string is a `team` label value.
  if (separatorIndex <= 0) {
    return { kind: 'label', key: 'team', value: selection };
  }
  return {
    kind: 'label',
    key: selection.slice(0, separatorIndex),
    value: selection.slice(separatorIndex + 1),
  };
}

/** What to show for a selection: the picked value, never the raw `key:value` encoding. */
export function ownershipFilterLabel(selection: TeamSelection): string {
  const scope = resolveTeamScope(selection);
  return scope.kind === 'label' ? scope.value : selection;
}
