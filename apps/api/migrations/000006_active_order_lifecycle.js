export const up = (pgm) => {
  pgm.addColumns("orders", {
    departed_at: { type: "timestamptz" },
    arrived_at: { type: "timestamptz" },
    work_started_at: { type: "timestamptz" },
    completed_at: { type: "timestamptz" },
    cancelled_at: { type: "timestamptz" },
    cancelled_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    cancellation_reason: { type: "text" },
    terminal_idempotency_key: { type: "text" },
  });

  pgm.createIndex("orders", "terminal_idempotency_key", {
    name: "orders_terminal_idempotency_unique",
    unique: true,
    where: "terminal_idempotency_key is not null",
  });

  pgm.sql(`
    alter table orders
      add constraint orders_lifecycle_timestamps_check
      check (
        (departed_at is null or status in ('provider_en_route', 'provider_arrived', 'in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'disputed'))
        and (arrived_at is null or status in ('provider_arrived', 'in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'disputed'))
        and (work_started_at is null or status in ('in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'disputed'))
        and (completed_at is null or status = 'completed')
        and (cancelled_at is null or status in ('cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin'))
        and ((cancelled_at is null and cancellation_reason is null) or (cancelled_at is not null and cancellation_reason is not null))
      )
  `);
};

export const down = (pgm) => {
  pgm.dropConstraint("orders", "orders_lifecycle_timestamps_check");
  pgm.dropIndex("orders", "terminal_idempotency_key", {
    name: "orders_terminal_idempotency_unique",
  });
  pgm.dropColumns("orders", [
    "departed_at",
    "arrived_at",
    "work_started_at",
    "completed_at",
    "cancelled_at",
    "cancelled_by_user_id",
    "cancellation_reason",
    "terminal_idempotency_key",
  ]);
};
