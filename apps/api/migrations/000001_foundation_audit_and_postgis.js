export const up = (pgm) => {
  pgm.createExtension("postgis", { ifNotExists: true });
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("audit_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    actor_id: {
      type: "uuid",
      notNull: false,
    },
    action: {
      type: "text",
      notNull: true,
    },
    reason: {
      type: "text",
      notNull: true,
    },
    related_entity_type: {
      type: "text",
      notNull: false,
    },
    related_entity_id: {
      type: "uuid",
      notNull: false,
    },
    metadata: {
      type: "jsonb",
      notNull: true,
      default: "{}",
    },
    occurred_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("audit_events", ["occurred_at"]);
  pgm.createIndex("audit_events", ["related_entity_type", "related_entity_id"]);
};

export const down = (pgm) => {
  pgm.dropTable("audit_events");
  pgm.dropExtension("pgcrypto", { ifExists: true });
  pgm.dropExtension("postgis", { ifExists: true });
};
