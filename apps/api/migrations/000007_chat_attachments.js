export const up = (pgm) => {
  pgm.createTable("order_conversations", {
    order_id: {
      type: "uuid",
      primaryKey: true,
      references: "orders(id)",
      onDelete: "cascade",
    },
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

  pgm.createTable("chat_messages", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "order_conversations(order_id)",
      onDelete: "cascade",
    },
    sender_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    sender_role: {
      type: "text",
      notNull: true,
      check: "sender_role in ('customer', 'provider', 'admin', 'system')",
    },
    message_type: {
      type: "text",
      notNull: true,
      check: "message_type in ('text', 'attachment', 'system')",
    },
    text_body: { type: "text" },
    system_event_type: { type: "text" },
    delivered_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.sql(`
    alter table chat_messages
      add constraint chat_messages_content_check
      check (
        (
          message_type = 'text'
          and sender_role in ('customer', 'provider', 'admin')
          and sender_user_id is not null
          and text_body is not null
          and system_event_type is null
        )
        or (
          message_type = 'attachment'
          and sender_role in ('customer', 'provider', 'admin')
          and sender_user_id is not null
          and text_body is null
          and system_event_type is null
        )
        or (
          message_type = 'system'
          and sender_role = 'system'
          and sender_user_id is null
          and text_body is null
          and system_event_type is not null
        )
      )
  `);
  pgm.createIndex("chat_messages", ["order_id", "created_at"], {
    name: "chat_messages_order_created_idx",
  });

  pgm.createTable("chat_attachments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    message_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "chat_messages(id)",
      onDelete: "cascade",
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "order_conversations(order_id)",
      onDelete: "cascade",
    },
    attachment_kind: {
      type: "text",
      notNull: true,
      check: "attachment_kind in ('photo', 'voice')",
    },
    private_object_key: { type: "text", notNull: true },
    original_filename: { type: "text", notNull: true },
    content_type: { type: "text", notNull: true },
    size_bytes: { type: "integer", notNull: true },
    duration_seconds: { type: "integer" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.sql(`
    alter table chat_attachments
      add constraint chat_attachments_kind_check
      check (
        (
          attachment_kind = 'photo'
          and content_type in ('image/jpeg', 'image/png', 'image/webp')
          and size_bytes > 0
          and size_bytes <= 20971520
          and duration_seconds is null
        )
        or (
          attachment_kind = 'voice'
          and content_type in ('audio/webm', 'audio/ogg', 'audio/mpeg')
          and size_bytes > 0
          and size_bytes <= 10485760
          and duration_seconds is not null
          and duration_seconds > 0
          and duration_seconds <= 180
        )
      )
  `);
  pgm.createIndex("chat_attachments", ["order_id", "created_at"], {
    name: "chat_attachments_order_created_idx",
  });

  pgm.createTable("chat_message_reports", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    message_id: {
      type: "uuid",
      notNull: true,
      references: "chat_messages(id)",
      onDelete: "cascade",
    },
    reporter_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "restrict",
    },
    reason: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("chat_message_reports", ["message_id", "reporter_user_id"], {
    name: "chat_message_reports_message_reporter_unique",
    unique: true,
  });

  pgm.createTable("chat_attachment_access_audit", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    attachment_id: {
      type: "uuid",
      notNull: true,
      references: "chat_attachments(id)",
      onDelete: "cascade",
    },
    actor_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    access_action: { type: "text", notNull: true },
    reason: { type: "text", notNull: true },
    occurred_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("chat_attachment_access_audit", ["attachment_id", "occurred_at"], {
    name: "chat_attachment_access_audit_attachment_time_idx",
  });
};

export const down = (pgm) => {
  pgm.dropTable("chat_attachment_access_audit");
  pgm.dropTable("chat_message_reports");
  pgm.dropTable("chat_attachments");
  pgm.dropTable("chat_messages");
  pgm.dropTable("order_conversations");
};
