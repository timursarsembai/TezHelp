export const up = (pgm) => {
  pgm.createTable("order_reviews", {
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
    direction: {
      type: "text",
      notNull: true,
      check: "direction in ('customer_to_provider', 'provider_to_customer')",
    },
    reviewer_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "restrict",
    },
    reviewee_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "restrict",
    },
    provider_service_profile_id: {
      type: "uuid",
      references: "provider_service_profiles(id)",
      onDelete: "restrict",
    },
    rating: { type: "integer", notNull: true },
    comment: { type: "text" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.sql(`
    alter table order_reviews
      add constraint order_reviews_rating_check
      check (rating between 1 and 5)
  `);
  pgm.sql(`
    alter table order_reviews
      add constraint order_reviews_direction_shape_check
      check (
        (
          direction = 'customer_to_provider'
          and provider_service_profile_id is not null
        )
        or (
          direction = 'provider_to_customer'
          and provider_service_profile_id is null
        )
      )
  `);
  pgm.createIndex("order_reviews", ["order_id", "direction"], {
    name: "order_reviews_order_direction_unique",
    unique: true,
  });
  pgm.createIndex("order_reviews", ["reviewee_user_id", "created_at"], {
    name: "order_reviews_reviewee_time_idx",
  });
  pgm.createIndex("order_reviews", ["provider_service_profile_id", "created_at"], {
    name: "order_reviews_service_profile_time_idx",
    where: "provider_service_profile_id is not null",
  });

  pgm.createTable("provider_sanctions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "provider_profiles(user_id)",
      onDelete: "restrict",
    },
    service_profile_id: {
      type: "uuid",
      references: "provider_service_profiles(id)",
      onDelete: "restrict",
    },
    sanction_type: {
      type: "text",
      notNull: true,
      check: "sanction_type in ('temporary_block', 'indefinite_block', 'manual_restriction')",
    },
    reason: { type: "text", notNull: true },
    starts_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    ends_at: { type: "timestamptz" },
    lifted_at: { type: "timestamptz" },
    lifted_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    lift_reason: { type: "text" },
    created_by_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "restrict",
    },
    appeal_status: {
      type: "text",
      notNull: true,
      default: "none",
      check: "appeal_status in ('none', 'submitted', 'accepted', 'rejected')",
    },
    appeal_reason: { type: "text" },
    appeal_submitted_at: { type: "timestamptz" },
    appeal_decided_at: { type: "timestamptz" },
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
    alter table provider_sanctions
      add constraint provider_sanctions_window_check
      check (
        (ends_at is null or ends_at > starts_at)
        and ((lifted_at is null and lift_reason is null) or (lifted_at is not null and lift_reason is not null))
        and ((appeal_status = 'none' and appeal_reason is null and appeal_submitted_at is null)
          or (appeal_status <> 'none' and appeal_reason is not null and appeal_submitted_at is not null))
      )
  `);
  pgm.createIndex("provider_sanctions", ["provider_user_id", "starts_at"], {
    name: "provider_sanctions_provider_time_idx",
  });
  pgm.createIndex("provider_sanctions", ["provider_user_id", "service_profile_id"], {
    name: "provider_sanctions_provider_scope_active_idx",
    where: "lifted_at is null",
  });

  pgm.createTable("provider_sanction_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    sanction_id: {
      type: "uuid",
      notNull: true,
      references: "provider_sanctions(id)",
      onDelete: "cascade",
    },
    actor_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    event_type: {
      type: "text",
      notNull: true,
      check:
        "event_type in ('applied', 'appealed', 'lifted', 'appeal_accepted', 'appeal_rejected')",
    },
    reason: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    occurred_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("provider_sanction_events", ["sanction_id", "occurred_at"], {
    name: "provider_sanction_events_sanction_time_idx",
  });
};

export const down = (pgm) => {
  pgm.dropTable("provider_sanction_events");
  pgm.dropTable("provider_sanctions");
  pgm.dropTable("order_reviews");
};
