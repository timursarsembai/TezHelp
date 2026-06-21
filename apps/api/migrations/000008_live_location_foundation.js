export const up = (pgm) => {
  pgm.createTable("live_location_sessions", {
    order_id: {
      type: "uuid",
      primaryKey: true,
      references: "orders(id)",
      onDelete: "cascade",
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "provider_profiles(user_id)",
      onDelete: "restrict",
    },
    tracking_state: {
      type: "text",
      notNull: true,
      default: "active",
      check: "tracking_state in ('active', 'stopped')",
    },
    last_point: { type: "geography(Point,4326)" },
    last_latitude: { type: "numeric(9,6)" },
    last_longitude: { type: "numeric(9,6)" },
    last_accuracy_meters: { type: "integer" },
    last_recorded_at: { type: "timestamptz" },
    last_sequence: { type: "integer", notNull: true, default: 0 },
    resumed_at: { type: "timestamptz" },
    stopped_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.sql(`
    alter table live_location_sessions
      add constraint live_location_sessions_latest_point_check
      check (
        (
          last_point is null
          and last_latitude is null
          and last_longitude is null
          and last_accuracy_meters is null
          and last_recorded_at is null
        )
        or (
          last_point is not null
          and last_latitude is not null
          and last_latitude between -90 and 90
          and last_longitude is not null
          and last_longitude between -180 and 180
          and last_accuracy_meters is not null
          and last_accuracy_meters >= 0
          and last_accuracy_meters <= 5000
          and last_recorded_at is not null
        )
      )
  `);
  pgm.createIndex("live_location_sessions", ["provider_user_id", "tracking_state"], {
    name: "live_location_sessions_provider_state_idx",
  });
  pgm.createIndex("live_location_sessions", "last_point", {
    name: "live_location_sessions_last_point_gist_idx",
    method: "gist",
  });

  pgm.createTable("live_location_updates", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "orders(id)",
      onDelete: "cascade",
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "provider_profiles(user_id)",
      onDelete: "restrict",
    },
    point: { type: "geography(Point,4326)", notNull: true },
    latitude: { type: "numeric(9,6)", notNull: true },
    longitude: { type: "numeric(9,6)", notNull: true },
    accuracy_meters: { type: "integer", notNull: true },
    recorded_at: { type: "timestamptz", notNull: true },
    received_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    sequence: { type: "integer", notNull: true },
    resumed: { type: "boolean", notNull: true, default: false },
  });
  pgm.sql(`
    alter table live_location_updates
      add constraint live_location_updates_coordinate_check
      check (
        latitude between -90 and 90
        and longitude between -180 and 180
        and accuracy_meters >= 0
        and accuracy_meters <= 5000
        and sequence > 0
      )
  `);
  pgm.createIndex("live_location_updates", ["order_id", "sequence"], {
    name: "live_location_updates_order_sequence_unique",
    unique: true,
  });
  pgm.createIndex("live_location_updates", ["order_id", "received_at"], {
    name: "live_location_updates_order_received_idx",
  });
  pgm.createIndex("live_location_updates", "point", {
    name: "live_location_updates_point_gist_idx",
    method: "gist",
  });
};

export const down = (pgm) => {
  pgm.dropTable("live_location_updates");
  pgm.dropTable("live_location_sessions");
};
