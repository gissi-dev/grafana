import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * The homepage alerts filter selection. '' is the default scope ("your teams" for
 * team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick;
 * `key:value` names one ownership label (e.g. `squad:Frontend`); a value with no
 * separator is a legacy team name stored before ownership labels. A plain string
 * so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "All teams" pick; never a real team name. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

/**
 * Ownership labels the homepage alerts dropdown offers. Alert labels are free-form
 * and high cardinality, so this stays a short allowlist rather than every label key.
 */
export const ALERT_OWNERSHIP_KEYS = ['team', 'squad', 'owner'] as const;

export type AlertOwnershipKey = (typeof ALERT_OWNERSHIP_KEYS)[number];

export type AlertLabelFilter = { key: AlertOwnershipKey; value: string };

// The key is an identifier, so the first ':' always separates it from the value.
const FILTER_SEPARATOR = ':';

type TeamScope = { kind: 'default' } | { kind: 'all' } | { kind: 'team'; team: string };

export function resolveTeamScope(selection: TeamSelection): TeamScope {
  if (selection === ALL_TEAMS) {
    return { kind: 'all' };
  }
  if (selection) {
    // Raw stored string: the combobox value has to match the selection, including `key:value`.
    return { kind: 'team', team: selection };
  }
  return { kind: 'default' };
}

function isOwnershipKey(key: string): key is AlertOwnershipKey {
  return ALERT_OWNERSHIP_KEYS.some((candidate) => candidate === key);
}

export function encodeAlertLabel({ key, value }: AlertLabelFilter): string {
  return `${key}${FILTER_SEPARATOR}${value}`;
}

/**
 * The ownership label an explicit pick names. `key:value` selects that key; a stored
 * value with no separator, or an unknown key, is a legacy team name matched on `team`.
 * Undefined for the default and all-teams scopes.
 */
export function decodeAlertLabel(selection: TeamSelection): AlertLabelFilter | undefined {
  if (!selection || selection === ALL_TEAMS) {
    return undefined;
  }
  const separatorIndex = selection.indexOf(FILTER_SEPARATOR);
  if (separatorIndex > 0) {
    const key = selection.slice(0, separatorIndex);
    if (isOwnershipKey(key)) {
      return { key, value: selection.slice(separatorIndex + 1) };
    }
  }
  return { key: 'team', value: selection };
}

/** What to show for a selection: the picked value, never the raw `key:value` encoding. */
export function alertFilterLabel(selection: TeamSelection): string {
  return decodeAlertLabel(selection)?.value ?? selection;
}
