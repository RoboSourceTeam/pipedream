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
  key: "avinode-create-trip",
  name: "Create Trip",
  description:
    "Create a trip search in Avinode (marketplace sourcing). [See the documentation](https://developer.avinodegroup.com/reference/createtrip)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    app,
    segments: {
      type: "any",
      label: "Segments",
      description:
        "Trip itinerary: array of segment objects (or JSON string). See API `CreateTripInput.segments`",
    },
    criteria: {
      type: "any",
      label: "Criteria",
      description:
        "Search criteria object (or JSON string). See API `BuyerTripCriteriaInputImpl`",
    },
    sourcing: {
      type: "boolean",
      label: "Sourcing",
      description: "Expose this trip in the marketplace for sourcing",
      default: true,
    },
    externalTripId: {
      type: "string",
      label: "External trip ID",
      description: "Optional identifier in your external system",
      optional: true,
    },
    postToTripBoard: {
      type: "boolean",
      label: "Post to Trip Board",
      description: "Whether to post this trip to the Avinode Trip Board",
      optional: true,
    },
    tripBoardPostMessage: {
      type: "string",
      label: "Trip Board message",
      description: "Message included when posting to the Trip Board",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      segments,
      criteria,
      sourcing,
      externalTripId,
      postToTripBoard,
      tripBoardPostMessage,
    } = this;
    const seg = asData(segments, "Segments");
    const crit = asData(criteria, "Criteria");
    if (!Array.isArray(seg)) {
      throw new Error("segments must be an array");
    }
    if (crit !== undefined && typeof crit !== "object") {
      throw new Error("criteria must be an object");
    }
    const payload = this.app._stripUndefined({
      segments: seg,
      criteria: crit ?? {},
      sourcing,
      externalTripId: externalTripId?.toString?.()?.trim(),
      postToTripBoard,
      tripBoardPostMessage: tripBoardPostMessage?.toString?.(),
    });
    const body = await this.app.createTrip({
      $,
      ...payload,
    });
    $.export("$summary", "Trip created in Avinode");
    return body;
  },
};
