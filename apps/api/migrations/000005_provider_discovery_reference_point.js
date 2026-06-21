export const up = (pgm) => {
  pgm.addColumns("provider_order_discovery_preferences", {
    reference_latitude: { type: "numeric(9,6)", notNull: true, default: 43.2389 },
    reference_longitude: { type: "numeric(9,6)", notNull: true, default: 76.8897 },
  });
  pgm.sql(`
    alter table provider_order_discovery_preferences
      add constraint provider_order_discovery_preferences_reference_point_check
      check (
        reference_latitude between 43.0 and 44.0
        and reference_longitude between 76.0 and 77.5
      )
  `);
};

export const down = (pgm) => {
  pgm.dropConstraint(
    "provider_order_discovery_preferences",
    "provider_order_discovery_preferences_reference_point_check",
  );
  pgm.dropColumns("provider_order_discovery_preferences", [
    "reference_latitude",
    "reference_longitude",
  ]);
};
