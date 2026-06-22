export const up = (pgm) => {
  pgm.addColumns("provider_profiles", {
    consecutive_provider_cancellations: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    cancellation_block_episode_count: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    activity_score_updated_at: {
      type: "timestamptz",
    },
  });
  pgm.sql(`
    alter table provider_profiles
      add constraint provider_profiles_activity_score_check
      check (activity_score between 0 and 100)
  `);
  pgm.sql(`
    alter table provider_profiles
      add constraint provider_profiles_activity_counters_check
      check (
        consecutive_provider_cancellations >= 0
        and cancellation_block_episode_count >= 0
      )
  `);
  pgm.sql(`
    alter table provider_sanctions
      alter column created_by_user_id drop not null
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    update provider_sanctions
      set created_by_user_id = provider_user_id
      where created_by_user_id is null
  `);
  pgm.sql(`
    alter table provider_sanctions
      alter column created_by_user_id set not null
  `);
  pgm.sql(`
    alter table provider_profiles
      drop constraint provider_profiles_activity_counters_check
  `);
  pgm.sql(`
    alter table provider_profiles
      drop constraint provider_profiles_activity_score_check
  `);
  pgm.dropColumns("provider_profiles", [
    "activity_score_updated_at",
    "cancellation_block_episode_count",
    "consecutive_provider_cancellations",
  ]);
};
