import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * The homepage alerts filter selection. '' is the default scope ("your teams" for
 * team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick;
 * `key:value` names one alert label value (e.g. `team:Platform`, `squad:Frontend`).
 * A bare name with no ':' is a team label value stored before the dropdown offered
 * other labels. A plain string so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "all alerts" pick; never a real label value. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

/** Label used for selections saved before the dropdown encoded `key:value`. */
const LEGACY_TEAM_LABEL = 'team';

// Label names are identifiers, so the first ':' always separates the key from the value.
const FILTER_SEPARATOR = ':';

type TeamScope = { kind: 'default' } | { kind: 'all' } | { kind: 'label'; label: string; value: string };

export function encodeAlertFilter(label: string, value: string): TeamSelection {
  return `${label}${FILTER_SEPARATOR}${value}`;
}

/** What to show for a selection: the picked value, never the raw `key:value` encoding. */
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
  const separatorIndex = selection.indexOf(FILTER_SEPARATOR);
  if (separatorIndex <= 0) {
    return { kind: 'label', label: LEGACY_TEAM_LABEL, value: selection };
  }
  return {
    kind: 'label',
    label: selection.slice(0, separatorIndex),
    value: selection.slice(separatorIndex + 1),
  };
}
