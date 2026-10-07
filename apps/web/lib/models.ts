// Short names for the API's generated response types (types/api.ts, from `pnpm api:types`).
import type { components } from "@/types/api";

type Schemas = components["schemas"];

export type Me = Schemas["MeOut"];
export type Summary = Schemas["Summary"];
export type CategoryPoint = Schemas["CategoryPoint"];
export type MonthPoint = Schemas["MonthPoint"];
export type Transaction = Schemas["TransactionOut"];
export type TransactionPage = Schemas["TransactionPage"];
export type Statement = Schemas["StatementOut"];
