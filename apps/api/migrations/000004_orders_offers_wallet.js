export const up = (pgm) => {
  pgm.addColumns("service_categories", {
    response_fee_kzt: { type: "integer", notNull: true, default: 100 },
    commission_strategy: {
      type: "text",
      notNull: true,
      default: "percentage",
      check: "commission_strategy in ('percentage', 'fixed', 'combined', 'zero')",
    },
    commission_percentage_bps: { type: "integer", notNull: true, default: 1000 },
    commission_fixed_kzt: { type: "integer", notNull: true, default: 0 },
    operational_minimum_kzt: { type: "integer", notNull: true, default: 3000 },
  });
  pgm.sql(`
    alter table service_categories
      add constraint service_categories_commercial_config_check
      check (
        response_fee_kzt >= 0
        and commission_percentage_bps >= 0
        and commission_fixed_kzt >= 0
        and operational_minimum_kzt >= 0
      )
  `);

  pgm.createTable("provider_order_discovery_preferences", {
    provider_user_id: {
      type: "uuid",
      primaryKey: true,
      references: "provider_profiles(user_id)",
      onDelete: "cascade",
    },
    nearby_enabled: { type: "boolean", notNull: true, default: false },
    radius_meters: { type: "integer", notNull: true, default: 5000 },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.sql(`
    alter table provider_order_discovery_preferences
      add constraint provider_order_discovery_preferences_radius_check
      check (radius_meters >= 3000)
  `);

  pgm.createTable("orders", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    customer_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "restrict",
    },
    category_slug: {
      type: "text",
      notNull: true,
      references: "service_categories(slug)",
      onDelete: "restrict",
    },
    status: {
      type: "text",
      notNull: true,
      default: "receiving_offers",
      check:
        "status in ('draft', 'published', 'receiving_offers', 'provider_selected', 'provider_en_route', 'provider_arrived', 'in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'disputed')",
    },
    city: { type: "text", notNull: true, default: "Almaty" },
    location: { type: "geography(Point,4326)", notNull: true },
    address_landmark: { type: "text", notNull: true },
    vehicle_make: { type: "text" },
    vehicle_model: { type: "text" },
    vehicle_year: { type: "integer" },
    description: { type: "text", notNull: true },
    unlocking_lawful_access: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    unlocking_verification_status: {
      type: "text",
      notNull: true,
      default: "not_required",
      check: "unlocking_verification_status in ('not_required', 'pending')",
    },
    assigned_provider_user_id: {
      type: "uuid",
      references: "provider_profiles(user_id)",
      onDelete: "restrict",
    },
    assigned_provider_service_profile_id: {
      type: "uuid",
      references: "provider_service_profiles(id)",
      onDelete: "restrict",
    },
    accepted_price_kzt: { type: "integer" },
    published_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    selected_at: { type: "timestamptz" },
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
    alter table orders
      add constraint orders_assignment_consistent
      check (
        (
          status <> 'provider_selected'
          and assigned_provider_user_id is null
          and assigned_provider_service_profile_id is null
          and accepted_price_kzt is null
          and selected_at is null
        )
        or (
          status = 'provider_selected'
          and assigned_provider_user_id is not null
          and assigned_provider_service_profile_id is not null
          and accepted_price_kzt is not null
          and accepted_price_kzt > 0
          and selected_at is not null
        )
        or status in ('provider_en_route', 'provider_arrived', 'in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'disputed')
      )
  `);
  pgm.createIndex("orders", ["category_slug", "status"], {
    name: "orders_category_status_idx",
  });
  pgm.createIndex("orders", "location", {
    name: "orders_location_gist_idx",
    method: "gist",
  });
  pgm.createIndex("orders", "assigned_provider_user_id", {
    name: "orders_one_active_provider_assignment",
    unique: true,
    where:
      "assigned_provider_user_id is not null and status in ('provider_selected', 'provider_en_route', 'provider_arrived', 'in_progress')",
  });

  pgm.createTable("order_status_history", {
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
    from_status: { type: "text" },
    to_status: { type: "text", notNull: true },
    actor_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    reason: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    occurred_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("order_status_history", ["order_id", "occurred_at"], {
    name: "order_status_history_order_time_idx",
  });

  pgm.createTable("order_images", {
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
    private_object_key: { type: "text", notNull: true },
    original_filename: { type: "text", notNull: true },
    content_type: { type: "text", notNull: true },
    size_bytes: { type: "integer", notNull: true },
    sort_order: { type: "integer", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("order_images", ["order_id", "sort_order"], {
    name: "order_images_order_sort_unique",
    unique: true,
  });

  pgm.createTable("wallet_accounts", {
    provider_user_id: {
      type: "uuid",
      primaryKey: true,
      references: "provider_profiles(user_id)",
      onDelete: "cascade",
    },
    available_balance_kzt: { type: "integer", notNull: true, default: 0 },
    reserved_balance_kzt: { type: "integer", notNull: true, default: 0 },
    free_responses_remaining: { type: "integer", notNull: true, default: 5 },
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
    alter table wallet_accounts
      add constraint wallet_accounts_non_negative_check
      check (
        available_balance_kzt >= 0
        and reserved_balance_kzt >= 0
        and free_responses_remaining >= 0
      )
  `);

  pgm.createTable("wallet_ledger_entries", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "wallet_accounts(provider_user_id)",
      onDelete: "restrict",
    },
    entry_type: {
      type: "text",
      notNull: true,
      check:
        "entry_type in ('manual_credit', 'manual_debit_correction', 'response_fee_charge', 'response_fee_reversal', 'commission_reserve', 'commission_release', 'commission_capture')",
    },
    amount_kzt: { type: "integer", notNull: true },
    available_delta_kzt: { type: "integer", notNull: true },
    reserved_delta_kzt: { type: "integer", notNull: true },
    resulting_available_balance_kzt: { type: "integer", notNull: true },
    resulting_reserved_balance_kzt: { type: "integer", notNull: true },
    idempotency_key: { type: "text", notNull: true },
    actor_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    reason: { type: "text", notNull: true },
    related_order_id: { type: "uuid" },
    related_offer_id: { type: "uuid" },
    related_commission_reservation_id: { type: "uuid" },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("wallet_ledger_entries", ["provider_user_id", "idempotency_key"], {
    name: "wallet_ledger_entries_provider_idempotency_unique",
    unique: true,
  });
  pgm.createIndex("wallet_ledger_entries", ["provider_user_id", "created_at"], {
    name: "wallet_ledger_entries_provider_time_idx",
  });

  pgm.createTable("offers", {
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
    provider_service_profile_id: {
      type: "uuid",
      notNull: true,
      references: "provider_service_profiles(id)",
      onDelete: "restrict",
    },
    price_kzt: { type: "integer", notNull: true },
    arrival_minutes: { type: "integer", notNull: true },
    comment: { type: "text", notNull: true },
    status: {
      type: "text",
      notNull: true,
      default: "active",
      check: "status in ('active', 'accepted', 'unavailable', 'retracted')",
    },
    response_fee_kzt: { type: "integer", notNull: true },
    free_response_credit_used: { type: "boolean", notNull: true, default: false },
    response_fee_ledger_entry_id: {
      type: "uuid",
      references: "wallet_ledger_entries(id)",
      onDelete: "restrict",
    },
    idempotency_key: { type: "text", notNull: true },
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
    alter table offers
      add constraint offers_positive_values_check
      check (price_kzt > 0 and arrival_minutes > 0 and response_fee_kzt >= 0)
  `);
  pgm.createIndex("offers", ["order_id", "provider_user_id"], {
    name: "offers_order_provider_unique",
    unique: true,
  });
  pgm.createIndex("offers", ["provider_user_id", "idempotency_key"], {
    name: "offers_provider_idempotency_unique",
    unique: true,
  });
  pgm.createIndex("offers", ["order_id", "status"], {
    name: "offers_order_status_idx",
  });

  pgm.createTable("commission_reservations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "orders(id)",
      onDelete: "restrict",
    },
    offer_id: {
      type: "uuid",
      notNull: true,
      references: "offers(id)",
      onDelete: "restrict",
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "provider_profiles(user_id)",
      onDelete: "restrict",
    },
    amount_kzt: { type: "integer", notNull: true },
    state: {
      type: "text",
      notNull: true,
      default: "reserved",
      check: "state in ('reserved', 'captured', 'released', 'held_for_review')",
    },
    idempotency_key: { type: "text", notNull: true },
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
    alter table commission_reservations
      add constraint commission_reservations_positive_amount_check
      check (amount_kzt >= 0)
  `);
  pgm.createIndex("commission_reservations", "order_id", {
    name: "commission_reservations_order_unique",
    unique: true,
  });
  pgm.createIndex("commission_reservations", "offer_id", {
    name: "commission_reservations_offer_unique",
    unique: true,
  });
  pgm.createIndex("commission_reservations", ["provider_user_id", "idempotency_key"], {
    name: "commission_reservations_provider_idempotency_unique",
    unique: true,
  });

  pgm.addColumns("orders", {
    selected_offer_id: {
      type: "uuid",
      references: "offers(id)",
      onDelete: "restrict",
    },
    commission_reservation_id: {
      type: "uuid",
      references: "commission_reservations(id)",
      onDelete: "restrict",
    },
  });
  pgm.createIndex("orders", "selected_offer_id", {
    name: "orders_selected_offer_unique",
    unique: true,
    where: "selected_offer_id is not null",
  });
};

export const down = (pgm) => {
  pgm.dropColumns("orders", ["selected_offer_id", "commission_reservation_id"]);
  pgm.dropTable("commission_reservations");
  pgm.dropTable("offers");
  pgm.dropTable("wallet_ledger_entries");
  pgm.dropTable("wallet_accounts");
  pgm.dropTable("order_images");
  pgm.dropTable("order_status_history");
  pgm.dropTable("orders");
  pgm.dropTable("provider_order_discovery_preferences");
  pgm.sql(
    "alter table service_categories drop constraint service_categories_commercial_config_check",
  );
  pgm.dropColumns("service_categories", [
    "response_fee_kzt",
    "commission_strategy",
    "commission_percentage_bps",
    "commission_fixed_kzt",
    "operational_minimum_kzt",
  ]);
};
