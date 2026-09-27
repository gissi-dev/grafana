import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * The homepage alerts ownership filter selection. '' is the default scope ("your teams"
 * for team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick;
 * `key:value` names one ownership label (e.g. `team:Platform`, `squad:Frontend`).
 * A plain string so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "All teams" pick; never a real label value. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

/** Alert labels that name who owns the alert. Deliberately short: alert labels are high-cardinality. */
export const OWNERSHIP_LABEL_KEYS = ['team', 'squad', 'owner'] as const;

export type OwnershipLabelKey = (typeof OWNERSHIP_LABEL_KEYS)[number];

const OWNERSHIP_LABEL_KEY_SET = new Set<string>(OWNERSHIP_LABEL_KEYS);

export function isOwnershipLabelKey(key: string): key is OwnershipLabelKey {
  return OWNERSHIP_LABEL_KEY_SET.has(key);
}

// Label keys are identifiers, so the first ':' always separates key from value.
const FILTER_SEPARATOR = ':';

type TeamScope = { kind: 'default' } | { kind: 'all' } | { kind: 'label'; key: OwnershipLabelKey; value: string };

export function encodeOwnershipSelection(key: OwnershipLabelKey, value: string): TeamSelection {
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
  if (separatorIndex > 0) {
    const key = selection.slice(0, separatorIndex);
    if (isOwnershipLabelKey(key)) {
      return { kind: 'label', key, value: selection.slice(separatorIndex + 1) };
    }
  }
  // A stored bare team name from before ownership keys, or a name whose prefix
  // isn't one of those keys. The whole string is the `team` label value.
  return { kind: 'label', key: 'team', value: selection };
}

/** What to show for a selection: the picked value, never the raw `key:value` encoding. */
export function ownershipFilterLabel(selection: TeamSelection): string {
  const scope = resolveTeamScope(selection);
  return scope.kind === 'label' ? scope.value : selection;
}
