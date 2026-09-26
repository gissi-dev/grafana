import { ALL_VARIABLE_VALUE } from 'app/features/variables/constants';

/**
 * The homepage alerts filter selection. '' is the default scope ("your teams" for
 * team members, everything otherwise); ALL_TEAMS is an explicit org-wide pick; anything
 * else is `label:value` naming one alert label value (e.g. `team:Platform`, `squad:Frontend`).
 * A plain string so localStorage and the Combobox can hold it as-is.
 * Incidents keep their own selection (see incidentFilter.ts) since their options differ.
 */
export type TeamSelection = string;

/** Sentinel for an explicit "All teams" / "All alerts" pick; never a real label value. */
export const ALL_TEAMS = ALL_VARIABLE_VALUE;

export const ALERTS_TEAM_FILTER_STORAGE_KEY = 'grafana.home.alerts.teamFilter';

export type AlertLabelFilter = { label: string; value: string };

// Label names are identifiers, so the first ':' always separates label from value.
const FILTER_SEPARATOR = ':';

export function encodeAlertFilter({ label, value }: AlertLabelFilter): TeamSelection {
  return `${label}${FILTER_SEPARATOR}${value}`;
}

/**
 * The label value the user picked, or undefined for the default / all scopes.
 * A bare value with no ':' (legacy team-only storage) is treated as `team:<name>`.
 */
export function decodeAlertFilter(selection: TeamSelection): AlertLabelFilter | undefined {
  if (!selection || selection === ALL_TEAMS) {
    return undefined;
  }
  const separatorIndex = selection.indexOf(FILTER_SEPARATOR);
  if (separatorIndex <= 0) {
    return { label: 'team', value: selection };
  }
  return { label: selection.slice(0, separatorIndex), value: selection.slice(separatorIndex + 1) };
}

/** What to show for a selection: the picked value, never the raw `label:value` encoding. */
export function alertFilterLabel(selection: TeamSelection): string {
  return decodeAlertFilter(selection)?.value ?? selection;
}

type AlertFilterScope =
  | { kind: 'default' }
  | { kind: 'all' }
  | { kind: 'label'; label: string; value: string };

export function resolveTeamScope(selection: TeamSelection): AlertFilterScope {
  if (selection === ALL_TEAMS) {
    return { kind: 'all' };
  }
  const filter = decodeAlertFilter(selection);
  if (filter) {
    return { kind: 'label', ...filter };
  }
  return { kind: 'default' };
}
