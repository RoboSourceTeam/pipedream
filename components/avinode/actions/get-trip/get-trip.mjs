import app from "../../avinode.app.mjs";

const TRIP_FIELD_OPTIONS = [
  "accountnames",
  "amenities",
  "analytics",
  "aviquote",
  "buyermessages",
  "categorydetails",
  "homebase",
  "insurance",
  "latestquote",
  "legacy_ids",
  "liftaoc",
  "office",
  "perfdetails",
  "quoteattachments",
  "quotebreakdown",
  "requestingcustomer",
  "safety",
  "sellercontactinfo",
  "sellermessagelinks",
  "sellerprofilephoto",
  "sellerstats",
  "taildetails",
  "tailphotos",
  "timestamps",
  "typedetails",
  "typephotos",
];

export default {
  key: "avinode-get-trip",
  name: "Get Trip",
  description:
    "Read a single trip. [See the documentation](https://developer.avinodegroup.com/reference/readtrip_1)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    tripId: {
      type: "string",
      label: "Trip ID",
      description: "Avinode trip identifier",
    },
    tripFields: {
      type: "string[]",
      label: "Sparse fields",
      description: "Optional `fields[trips]` values to include in the response",
      optional: true,
      options: TRIP_FIELD_OPTIONS,
    },
  },
  async run({ $ }) {
    const {
      tripId, tripFields,
    } = this;
    const body = await this.app.getTrip({
      $,
      tripId,
      tripFields,
    });
    $.export("$summary", `Retrieved trip \`${tripId}\``);
    return body;
  },
};
