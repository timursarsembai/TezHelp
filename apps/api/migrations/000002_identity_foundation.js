export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    preferred_locale: {
      type: "text",
      notNull: true,
      default: "ru",
      check: "preferred_locale in ('ru', 'kk', 'en')",
    },
    status: {
      type: "text",
      notNull: true,
      default: "pending_phone",
      check: "status in ('pending_phone', 'active', 'blocked')",
    },
    selected_role: {
      type: "text",
      notNull: true,
      default: "customer",
      check: "selected_role in ('customer', 'provider')",
    },
    verified_phone: { type: "text" },
    phone_verified_at: { type: "timestamptz" },
    recent_auth_at: { type: "timestamptz" },
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
    alter table users
      add constraint users_phone_verification_consistent
      check (
        (verified_phone is null and phone_verified_at is null)
        or (verified_phone is not null and phone_verified_at is not null)
      )
  `);
  pgm.createIndex("users", "verified_phone", {
    name: "users_active_verified_phone_unique",
    unique: true,
    where: "verified_phone is not null and status <> 'blocked'",
  });

  pgm.createTable("auth_identity_links", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    provider: {
      type: "text",
      notNull: true,
      check: "provider in ('google', 'phone')",
    },
    provider_subject: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("auth_identity_links", ["provider", "provider_subject"], {
    name: "auth_identity_links_provider_subject_unique",
    unique: true,
  });
  pgm.createIndex("auth_identity_links", ["user_id", "provider"], {
    name: "auth_identity_links_user_provider_idx",
  });

  pgm.createTable("customer_profiles", {
    user_id: {
      type: "uuid",
      primaryKey: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("provider_profiles", {
    user_id: {
      type: "uuid",
      primaryKey: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    activity_score: { type: "integer", notNull: true, default: 100 },
    availability_status: {
      type: "text",
      notNull: true,
      default: "inactive",
      check: "availability_status in ('inactive', 'available', 'suspended')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("otp_challenges", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "cascade",
    },
    purpose: {
      type: "text",
      notNull: true,
      check: "purpose in ('sign_in', 'phone_completion', 'phone_change')",
    },
    phone: { type: "text", notNull: true },
    phone_hash: { type: "text", notNull: true },
    otp_hash: { type: "text", notNull: true },
    request_ip_hash: { type: "text", notNull: true },
    attempts_remaining: { type: "integer", notNull: true },
    expires_at: { type: "timestamptz", notNull: true },
    resend_available_at: { type: "timestamptz", notNull: true },
    verified_at: { type: "timestamptz" },
    locked_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("otp_challenges", ["phone_hash", "purpose", "created_at"], {
    name: "otp_challenges_phone_purpose_created_idx",
  });
  pgm.createIndex("otp_challenges", ["user_id", "purpose", "created_at"], {
    name: "otp_challenges_user_purpose_created_idx",
  });

  pgm.createTable("user_sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    recent_auth_at: { type: "timestamptz", notNull: true },
    revoked_at: { type: "timestamptz" },
  });
  pgm.createIndex("user_sessions", ["user_id", "revoked_at"], {
    name: "user_sessions_active_idx",
  });

  pgm.createTable("identity_security_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    event_type: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    occurred_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("identity_security_events", ["user_id", "occurred_at"], {
    name: "identity_security_events_user_time_idx",
  });
};

export const down = (pgm) => {
  pgm.dropTable("identity_security_events");
  pgm.dropTable("user_sessions");
  pgm.dropTable("otp_challenges");
  pgm.dropTable("provider_profiles");
  pgm.dropTable("customer_profiles");
  pgm.dropTable("auth_identity_links");
  pgm.dropTable("users");
};
