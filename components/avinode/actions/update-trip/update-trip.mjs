import app from "../../avinode.app.mjs";

function asData(value, label) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${label} must be valid JSON when provided as a string`);
    }
  }
  return value;
}

export default {
  key: "avinode-update-trip",
  name: "Update Trip",
  description:
    "Update an existing trip. [See the documentation](https://developer.avinodegroup.com/reference/updatetripbynumericid)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    app,
    tripId: {
      type: "string",
      label: "Trip ID",
      description: "Avinode trip identifier to update",
    },
    segments: {
      type: "any",
      label: "Segments",
      description: "Updated itinerary: array of segment objects (or JSON string)",
    },
    sourcing: {
      type: "boolean",
      label: "Sourcing",
      description: "Whether the trip is available for marketplace sourcing",
      default: false,
    },
    criteria: {
      type: "any",
      label: "Criteria",
      description: "Optional criteria object (or JSON string)",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      tripId, segments, sourcing, criteria,
    } = this;
    const seg = asData(segments, "Segments");
    const crit = asData(criteria, "Criteria");
    if (!Array.isArray(seg)) {
      throw new Error("segments must be an array");
    }
    const body = await this.app.updateTrip({
      $,
      tripId,
      segments: seg,
      sourcing,
      ...(crit !== undefined && typeof crit === "object"
        ? {
          criteria: crit,
        }
        : {}),
    });
    $.export("$summary", `Updated trip \`${tripId}\``);
    return body;
  },
};
