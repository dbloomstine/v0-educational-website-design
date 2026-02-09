import type { SortField } from "@/lib/hooks/use-fund-watch-filters"

export interface ColumnDef {
  key: string
  label: string
  defaultVisible: boolean
  sortKey?: SortField
  tooltip?: string
  filterable?: boolean
  width: number
}

export const COLUMNS: ColumnDef[] = [
  {
    key: "fund",
    label: "Fund Name",
    defaultVisible: true,
    sortKey: "name",
    tooltip: "Name of the fund vehicle",
    width: 280,
  },
  {
    key: "firm",
    label: "Fund Manager",
    defaultVisible: true,
    sortKey: "firm",
    tooltip: "General partner or management firm",
    filterable: true,
    width: 180,
  },
  {
    key: "website",
    label: "Website",
    defaultVisible: false,
    tooltip: "Fund manager's official website",
    width: 140,
  },
  {
    key: "amount",
    label: "Amount",
    defaultVisible: true,
    sortKey: "amount",
    tooltip: "Total fund size or capital raised",
    width: 110,
  },
  {
    key: "category",
    label: "Category",
    defaultVisible: true,
    sortKey: "category",
    tooltip: "Fund strategy type (PE, VC, Credit, etc.)",
    filterable: true,
    width: 150,
  },
  {
    key: "stage",
    label: "Stage",
    defaultVisible: true,
    sortKey: "stage",
    tooltip: "Fundraising milestone: first close, interim close, final close, or launch",
    filterable: true,
    width: 130,
  },
  {
    key: "quarter",
    label: "Quarter",
    defaultVisible: false,
    sortKey: "quarter",
    tooltip: "Fiscal quarter of the announcement",
    width: 90,
  },
  {
    key: "date",
    label: "Date",
    defaultVisible: true,
    sortKey: "date",
    tooltip: "When the fund close/launch was publicly announced",
    width: 120,
  },
  {
    key: "date_added",
    label: "Date Added",
    defaultVisible: false,
    sortKey: "date_added",
    tooltip: "When this fund was added to FundWatch",
    width: 120,
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    sortKey: "city",
    tooltip: "Firm headquarters city",
    filterable: true,
    width: 120,
  },
  {
    key: "state",
    label: "State",
    defaultVisible: false,
    sortKey: "state",
    tooltip: "State or province (US/Canada)",
    width: 70,
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: false,
    sortKey: "country",
    tooltip: "Country where the firm is headquartered",
    filterable: true,
    width: 90,
  },
  {
    key: "source_name",
    label: "Source",
    defaultVisible: true,
    tooltip: "Primary news source for the announcement",
    filterable: true,
    width: 140,
  },
]

export const CHEVRON_WIDTH = 40

export const COLUMN_ORDER = ["chevron", ...COLUMNS.map((c) => c.key)]

export const FILTERABLE_COLUMNS = new Set(
  COLUMNS.filter((c) => c.filterable).map((c) => c.key)
)

const columnsByKey = new Map(COLUMNS.map((c) => [c.key, c]))

export function getColumnDef(key: string): ColumnDef | undefined {
  return columnsByKey.get(key)
}

export function getDefaultColumnWidths(): Record<string, number> {
  const widths: Record<string, number> = { chevron: CHEVRON_WIDTH }
  for (const col of COLUMNS) {
    widths[col.key] = col.width
  }
  return widths
}

export function getDefaultVisibleColumns(): Set<string> {
  return new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
}
