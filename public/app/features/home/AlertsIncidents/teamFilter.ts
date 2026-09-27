import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * Ownership label keys the homepage alerts dropdown offers. Kept short on purpose:
 * alert labels are free-form and high-cardinality, so we only fetch these few keys
 * rather than discovering every label on the org's alerts.
 */
export const HOME_ALERT_OWNERSHIP_LABEL_KEYS = ['team', 'squad', 'owner'] as const;

export type OwnershipLabelKey = (typeof HOME_ALERT_OWNERSHIP_LABEL_KEYS)[number];

/**
 * The homepage alerts filter selection. '' is the default scope ("your teams" for
 * team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick;
 * anything else is an encoded `slug:value` (or a legacy plain team name). A plain
 * string so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "All teams" pick; never a real team name. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

export type OwnershipLabelFilter = { slug: string; value: string };

// Label keys are identifiers, so the first ':' always separates slug from value.
const FILTER_SEPARATOR = ':';

export function encodeAlertFilter({ slug, value }: OwnershipLabelFilter): TeamSelection {
  return `${slug}${FILTER_SEPARATOR}${value}`;
}

/**
 * Decode a selection into slug+value. Encoded `slug:value` wins; a legacy plain
 * team name (no separator) is treated as `team:<name>` so stored picks keep working.
 * Returns undefined for the default and all-teams scopes.
 */
export function decodeAlertFilter(selection: TeamSelection): OwnershipLabelFilter | undefined {
  if (!selection || selection === ALL_TEAMS) {
    return undefined;
  }
  const separatorIndex = selection.indexOf(FILTER_SEPARATOR);
  if (separatorIndex <= 0) {
    return { slug: 'team', value: selection };
  }
  return { slug: selection.slice(0, separatorIndex), value: selection.slice(separatorIndex + 1) };
}

/** What to show for a selection: the picked value, never the raw `slug:value` encoding. */
export function alertFilterLabel(selection: TeamSelection): string {
  return decodeAlertFilter(selection)?.value ?? selection;
}

/** Display group header for an ownership label key (e.g. `squad` → `Squad`). */
export function ownershipLabelGroup(key: OwnershipLabelKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

type TeamScope = { kind: 'default' } | { kind: 'all' } | { kind: 'team'; team: string };

export function resolveTeamScope(selection: TeamSelection): TeamScope {
  if (selection === ALL_TEAMS) {
    return { kind: 'all' };
  }
  if (selection) {
    return { kind: 'team', team: selection };
  }
  return { kind: 'default' };
}
