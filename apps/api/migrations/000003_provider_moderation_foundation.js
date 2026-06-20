const categories = [
  {
    slug: "jump_start",
    sortOrder: 10,
    names: {
      ru: "Прикурить автомобиль",
      kk: "Аккумулятордан оталдыру",
      en: "Jump start",
    },
    descriptions: {
      ru: "Помощь с запуском автомобиля от внешнего источника питания.",
      kk: "Көлікті сыртқы қуат көзінен оталдыру көмегі.",
      en: "Help starting a vehicle from an external power source.",
    },
  },
  {
    slug: "engine_start_assistance",
    sortOrder: 20,
    names: {
      ru: "Помощь с запуском двигателя",
      kk: "Қозғалтқышты іске қосуға көмек",
      en: "Engine start assistance",
    },
    descriptions: {
      ru: "Диагностика простых причин и помощь с запуском двигателя на месте.",
      kk: "Қарапайым себептерді тексеру және қозғалтқышты орнында іске қосуға көмек.",
      en: "Basic on-site checks and help starting the engine.",
    },
  },
  {
    slug: "wheel_replacement",
    sortOrder: 30,
    names: {
      ru: "Замена колеса",
      kk: "Дөңгелек ауыстыру",
      en: "Wheel replacement",
    },
    descriptions: {
      ru: "Замена поврежденного колеса на запасное колесо клиента.",
      kk: "Зақымдалған дөңгелекті клиенттің қосалқы дөңгелегіне ауыстыру.",
      en: "Replacing a damaged wheel with the customer's spare wheel.",
    },
  },
  {
    slug: "wheel_inflation",
    sortOrder: 40,
    names: {
      ru: "Подкачать колесо",
      kk: "Дөңгелек үрлеу",
      en: "Wheel inflation",
    },
    descriptions: {
      ru: "Подкачка шин на месте с переносным компрессором.",
      kk: "Жылжымалы компрессормен шинаны орнында үрлеу.",
      en: "On-site tire inflation with a portable compressor.",
    },
  },
  {
    slug: "mobile_tire_service",
    sortOrder: 50,
    names: {
      ru: "Выездной шиномонтаж",
      kk: "Жылжымалы шина қызметі",
      en: "Mobile tire service",
    },
    descriptions: {
      ru: "Выездной ремонт или обслуживание шин на месте.",
      kk: "Шинаны орнында жөндеу немесе қызмет көрсету.",
      en: "On-site tire repair or service.",
    },
  },
  {
    slug: "fuel_delivery",
    sortOrder: 60,
    names: {
      ru: "Доставка топлива",
      kk: "Жанармай жеткізу",
      en: "Fuel delivery",
    },
    descriptions: {
      ru: "Доставка небольшого объема топлива для продолжения движения.",
      kk: "Жолды жалғастыру үшін аз көлемде жанармай жеткізу.",
      en: "Delivery of a small amount of fuel so the driver can continue.",
    },
  },
  {
    slug: "tow_truck",
    sortOrder: 70,
    names: {
      ru: "Эвакуатор",
      kk: "Эвакуатор",
      en: "Tow truck",
    },
    descriptions: {
      ru: "Эвакуация автомобиля с подтвержденным правом использования транспорта.",
      kk: "Көлікті пайдалану құқығы расталған эвакуация қызметі.",
      en: "Vehicle towing with confirmed right to use the towing vehicle.",
    },
  },
  {
    slug: "vehicle_unlocking",
    sortOrder: 80,
    names: {
      ru: "Вскрытие автомобиля",
      kk: "Көлікті ашу",
      en: "Vehicle unlocking",
    },
    descriptions: {
      ru: "Высокорисковая услуга с отдельной проверкой квалификации и правил законного доступа.",
      kk: "Біліктілік пен заңды қол жеткізу ережелері бөлек тексерілетін жоғары тәуекелді қызмет.",
      en: "High-risk service with separate qualification and lawful-access checks.",
    },
  },
];

const localizedLabel = (ru, kk, en) => JSON.stringify({ ru, kk, en });

const sqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;

const defaultAllowances = categories.flatMap((category) => [
  { category: category.slug, taxStatus: "individual_entrepreneur" },
  { category: category.slug, taxStatus: "self_employed_special_tax" },
]);

const documentRules = [
  {
    category: "tow_truck",
    documentType: "driver_license",
    label: localizedLabel("Водительское удостоверение", "Жүргізуші куәлігі", "Driver license"),
    sortOrder: 10,
  },
  {
    category: "tow_truck",
    documentType: "tow_vehicle_data",
    label: localizedLabel("Данные эвакуатора", "Эвакуатор деректері", "Tow vehicle data"),
    sortOrder: 20,
  },
  {
    category: "tow_truck",
    documentType: "state_number",
    label: localizedLabel("Государственный номер", "Мемлекеттік нөмір", "State number"),
    sortOrder: 30,
  },
  {
    category: "tow_truck",
    documentType: "vehicle_registration_certificate",
    label: localizedLabel(
      "СРТС / технический паспорт",
      "Көлік тіркеу куәлігі / техникалық паспорт",
      "Vehicle registration certificate",
    ),
    sortOrder: 40,
  },
  {
    category: "tow_truck",
    documentType: "vehicle_use_right",
    label: localizedLabel(
      "Право использования транспорта",
      "Көлікті пайдалану құқығы",
      "Right to use the vehicle",
    ),
    sortOrder: 50,
  },
  {
    category: "vehicle_unlocking",
    documentType: "qualification_proof",
    label: localizedLabel(
      "Опыт или квалификация",
      "Тәжірибе немесе біліктілік",
      "Experience or qualification proof",
    ),
    sortOrder: 10,
  },
  {
    category: "vehicle_unlocking",
    documentType: "lawful_access_acceptance",
    label: localizedLabel(
      "Согласие с правилами законного доступа",
      "Заңды қол жеткізу ережелерімен келісім",
      "Lawful-access rules acceptance",
    ),
    sortOrder: 20,
  },
];

export const up = (pgm) => {
  pgm.createTable("service_categories", {
    slug: { type: "text", primaryKey: true },
    enabled: { type: "boolean", notNull: true, default: true },
    sort_order: { type: "integer", notNull: true },
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

  pgm.createTable("service_category_translations", {
    category_slug: {
      type: "text",
      notNull: true,
      references: "service_categories(slug)",
      onDelete: "cascade",
    },
    locale: {
      type: "text",
      notNull: true,
      check: "locale in ('ru', 'kk', 'en')",
    },
    name: { type: "text", notNull: true },
    description: { type: "text", notNull: true },
  });
  pgm.addConstraint(
    "service_category_translations",
    "service_category_translations_pk",
    "primary key (category_slug, locale)",
  );

  pgm.createTable("service_category_tax_allowances", {
    category_slug: {
      type: "text",
      notNull: true,
      references: "service_categories(slug)",
      onDelete: "cascade",
    },
    tax_status: {
      type: "text",
      notNull: true,
      check: "tax_status in ('individual_entrepreneur', 'self_employed_special_tax')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint(
    "service_category_tax_allowances",
    "service_category_tax_allowances_pk",
    "primary key (category_slug, tax_status)",
  );

  pgm.createTable("service_category_document_rules", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    category_slug: {
      type: "text",
      notNull: true,
      references: "service_categories(slug)",
      onDelete: "cascade",
    },
    document_type: { type: "text", notNull: true },
    localized_label: { type: "jsonb", notNull: true },
    required: { type: "boolean", notNull: true, default: true },
    allowed_mime_types: {
      type: "text[]",
      notNull: true,
      default: pgm.func("array['image/jpeg','image/png','application/pdf']::text[]"),
    },
    max_size_bytes: { type: "integer", notNull: true, default: 10485760 },
    metadata_schema: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    sort_order: { type: "integer", notNull: true, default: 100 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("service_category_document_rules", ["category_slug", "document_type"], {
    name: "service_category_document_rules_category_type_unique",
    unique: true,
  });

  pgm.addColumns("provider_profiles", {
    display_name: { type: "text" },
    iin: { type: "text", check: "iin is null or iin ~ '^[0-9]{12}$'" },
    city: { type: "text" },
    tax_status: {
      type: "text",
      check:
        "tax_status is null or tax_status in ('individual_entrepreneur', 'self_employed_special_tax')",
    },
    general_document_version: { type: "integer", notNull: true, default: 0 },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("provider_service_profiles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "provider_profiles(user_id)",
      onDelete: "cascade",
    },
    category_slug: {
      type: "text",
      notNull: true,
      references: "service_categories(slug)",
      onDelete: "restrict",
    },
    moderation_status: {
      type: "text",
      notNull: true,
      default: "draft",
      check:
        "moderation_status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended')",
    },
    submitted_at: { type: "timestamptz" },
    sla_deadline_at: { type: "timestamptz" },
    moderator_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    decided_at: { type: "timestamptz" },
    decision_reason: { type: "text" },
    suspended_at: { type: "timestamptz" },
    suspension_reason: { type: "text" },
    document_version: { type: "integer", notNull: true, default: 0 },
    rating_average: { type: "numeric(3,2)" },
    rating_count: { type: "integer", notNull: true, default: 0 },
    completed_order_count: { type: "integer", notNull: true, default: 0 },
    cancellation_count: { type: "integer", notNull: true, default: 0 },
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
  pgm.createIndex("provider_service_profiles", ["provider_user_id", "category_slug"], {
    name: "provider_service_profiles_provider_category_unique",
    unique: true,
  });
  pgm.createIndex("provider_service_profiles", ["moderation_status", "sla_deadline_at"], {
    name: "provider_service_profiles_queue_idx",
  });

  pgm.createTable("provider_documents", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    provider_user_id: {
      type: "uuid",
      notNull: true,
      references: "provider_profiles(user_id)",
      onDelete: "cascade",
    },
    service_profile_id: {
      type: "uuid",
      references: "provider_service_profiles(id)",
      onDelete: "cascade",
    },
    document_type: { type: "text", notNull: true },
    private_object_key: { type: "text", notNull: true },
    original_filename: { type: "text", notNull: true },
    content_type: { type: "text", notNull: true },
    size_bytes: { type: "integer", notNull: true },
    document_version: { type: "integer", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.sql(`
    alter table provider_documents
      add constraint provider_documents_scope_check
      check (
        (service_profile_id is null and document_type in ('face_photo', 'identity_document'))
        or service_profile_id is not null
      )
  `);
  pgm.createIndex("provider_documents", ["provider_user_id", "document_type", "created_at"], {
    name: "provider_documents_provider_type_created_idx",
  });
  pgm.createIndex("provider_documents", ["service_profile_id", "document_type", "created_at"], {
    name: "provider_documents_service_type_created_idx",
  });

  pgm.createTable("provider_moderation_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    service_profile_id: {
      type: "uuid",
      notNull: true,
      references: "provider_service_profiles(id)",
      onDelete: "cascade",
    },
    actor_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "set null",
    },
    action: { type: "text", notNull: true },
    from_status: { type: "text" },
    to_status: { type: "text", notNull: true },
    reason: { type: "text" },
    document_version: { type: "integer", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    occurred_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("provider_moderation_events", ["service_profile_id", "occurred_at"], {
    name: "provider_moderation_events_profile_time_idx",
  });

  pgm.createTable("provider_document_access_audit", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    document_id: {
      type: "uuid",
      notNull: true,
      references: "provider_documents(id)",
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
  pgm.createIndex("provider_document_access_audit", ["document_id", "occurred_at"], {
    name: "provider_document_access_audit_document_time_idx",
  });

  for (const category of categories) {
    pgm.sql(
      `insert into service_categories (slug, sort_order)
       values (${sqlLiteral(category.slug)}, ${category.sortOrder})`,
    );
    for (const locale of ["ru", "kk", "en"]) {
      pgm.sql(
        `insert into service_category_translations (category_slug, locale, name, description)
         values (
           ${sqlLiteral(category.slug)},
           ${sqlLiteral(locale)},
           ${sqlLiteral(category.names[locale])},
           ${sqlLiteral(category.descriptions[locale])}
         )`,
      );
    }
  }

  for (const allowance of defaultAllowances) {
    pgm.sql(
      `insert into service_category_tax_allowances (category_slug, tax_status)
       values (${sqlLiteral(allowance.category)}, ${sqlLiteral(allowance.taxStatus)})`,
    );
  }

  for (const rule of documentRules) {
    pgm.sql(
      `insert into service_category_document_rules
        (category_slug, document_type, localized_label, sort_order)
       values (
         ${sqlLiteral(rule.category)},
         ${sqlLiteral(rule.documentType)},
         ${sqlLiteral(rule.label)}::jsonb,
         ${rule.sortOrder}
       )`,
    );
  }
};

export const down = (pgm) => {
  pgm.dropTable("provider_document_access_audit");
  pgm.dropTable("provider_moderation_events");
  pgm.dropTable("provider_documents");
  pgm.dropTable("provider_service_profiles");
  pgm.dropColumns("provider_profiles", [
    "display_name",
    "iin",
    "city",
    "tax_status",
    "general_document_version",
    "updated_at",
  ]);
  pgm.dropTable("service_category_document_rules");
  pgm.dropTable("service_category_tax_allowances");
  pgm.dropTable("service_category_translations");
  pgm.dropTable("service_categories");
};
