export const up = (pgm) => {
  pgm.addColumns("user_sessions", {
    token_hash: {
      type: "text",
      notNull: true,
    },
  });
  pgm.createIndex("user_sessions", "token_hash", {
    name: "user_sessions_token_hash_unique",
    unique: true,
  });

  pgm.addColumns("users", {
    is_staff: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    staff_role: {
      type: "text",
    },
  });
  pgm.sql(`
    alter table users
      add constraint users_staff_role_consistent
      check (
        (is_staff = false and staff_role is null)
        or (is_staff = true and staff_role in ('support', 'moderator', 'super_admin'))
      )
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    alter table users
      drop constraint users_staff_role_consistent
  `);
  pgm.dropColumns("users", ["staff_role", "is_staff"]);
  pgm.dropIndex("user_sessions", "token_hash", {
    name: "user_sessions_token_hash_unique",
  });
  pgm.dropColumns("user_sessions", ["token_hash"]);
};
