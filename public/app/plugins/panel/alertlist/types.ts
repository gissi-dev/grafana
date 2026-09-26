import { type ThresholdsConfig, ThresholdsMode, type ValueMapping } from '@grafana/data';
import { type BigValueColorMode } from '@grafana/ui';

export enum SortOrder {
  AlphaAsc = 1,
  AlphaDesc,
  Importance,
  TimeAsc,
  TimeDesc,
}

export enum GroupMode {
  Default = 'default',
  Custom = 'custom',
}

/** How custom grouping lays out rules relative to label groups. */
export enum CustomGroupLayout {
  /** One row per alert rule, then subgroups by the chosen labels. */
  ByRule = 'byRule',
  /** One row per label tuple across rules (legacy custom grouping). */
  Flat = 'flat',
}

export enum ViewMode {
  List = 'list',
  Stat = 'stat',
}

/** Max number of label keys a user can pin for instance display. */
export const PRIORITY_LABELS_MAX = 3;

export interface StateFilter {
  firing: boolean;
  pending: boolean;
  inactive?: boolean; // backwards compat
  recovering: boolean;
  noData: boolean;
  normal: boolean;
  error: boolean;
}

export interface UnifiedAlertListOptions {
  maxItems: number;
  sortOrder: SortOrder;
  dashboardAlerts: boolean;
  groupMode: GroupMode;
  groupBy: string[];
  /** Layout for custom grouping; ignored when groupMode is default. */
  customGroupLayout: CustomGroupLayout;
  alertName: string;
  showInstances: boolean;
  /**
   * Label keys to show first on each instance. Remaining labels collapse behind
   * "+ N other labels". Empty keeps the default label display.
   */
  priorityLabels: string[];
  folder: { uid: string; title: string };
  stateFilter: StateFilter;
  alertInstanceLabelFilter: string;
  datasource: string;
  viewMode: ViewMode;
  showInactiveAlerts: boolean;
  statColorMode: BigValueColorMode;
  statThresholds: ThresholdsConfig;
  statValueMappings: ValueMapping[];
}

export const STAT_THRESHOLDS_DEFAULT: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { value: -Infinity, color: 'green' },
    { value: 80, color: 'red' },
  ],
};
