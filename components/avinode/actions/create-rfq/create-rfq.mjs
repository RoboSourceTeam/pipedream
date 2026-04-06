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
  key: "avinode-create-rfq",
  name: "Create RFQ",
  description:
    "Create a request-for-quote (RFQ). [See the documentation](https://developer.avinodegroup.com/reference/createrfq_1)",
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
      description: "Optional existing trip to associate",
      optional: true,
    },
    searchResultIds: {
      type: "string[]",
      label: "Search result IDs",
      description: "Optional search result IDs (omit segments/criteria when using these)",
      optional: true,
    },
    buyerMessage: {
      type: "string",
      label: "Buyer message",
      description: "Message to the seller (max 4000 characters)",
      optional: true,
    },
    buyerNotificationSettings: {
      type: "string",
      label: "Buyer notification settings",
      description: "Notification settings name (Company > Settings > Webhooks)",
      optional: true,
    },
    segments: {
      type: "any",
      label: "Segments",
      description: "Optional itinerary array (or JSON string) if not using search result IDs",
      optional: true,
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
      tripId,
      searchResultIds,
      buyerMessage,
      buyerNotificationSettings,
      segments,
      criteria,
    } = this;
    const seg = asData(segments, "Segments");
    const crit = asData(criteria, "Criteria");
    if (seg !== undefined && !Array.isArray(seg)) {
      throw new Error("segments must be an array");
    }
    if (crit !== undefined && typeof crit !== "object") {
      throw new Error("criteria must be an object");
    }
    const body = this.app._stripUndefined({
      tripId: tripId?.toString?.()?.trim(),
      searchResultIds,
      buyerMessage: buyerMessage?.toString?.(),
      buyerNotificationSettings: buyerNotificationSettings?.toString?.()?.trim(),
      segments: seg,
      criteria: crit,
    });
    const res = await this.app.createRfq({
      $,
      ...body,
    });
    $.export("$summary", "RFQ created in Avinode");
    return res;
  },
};
