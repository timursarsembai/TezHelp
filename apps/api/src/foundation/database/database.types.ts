import type { ColumnType, Generated, Insertable, Kysely } from "kysely";

interface AuditEventsTable {
  readonly id: Generated<string>;
  readonly actor_id: string | null;
  readonly action: string;
  readonly reason: string;
  readonly related_entity_type: string | null;
  readonly related_entity_id: string | null;
  readonly metadata: ColumnType<
    Record<string, unknown>,
    Record<string, unknown> | undefined,
    Record<string, unknown>
  >;
  readonly occurred_at: Generated<Date>;
}

export interface DatabaseSchema {
  readonly audit_events: AuditEventsTable;
}

export type TezHelpDatabase = Kysely<DatabaseSchema>;
export type NewAuditEvent = Insertable<AuditEventsTable>;
