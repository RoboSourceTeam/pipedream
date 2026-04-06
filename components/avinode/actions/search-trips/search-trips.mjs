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
  key: "avinode-search-trips",
  name: "Search Trips",
  description:
    "Search trips by trip identifier. [See the documentation](https://developer.avinodegroup.com/reference/searchtrips)",
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
      description: "Trip identifier to search for",
    },
    tripFields: {
      type: "string[]",
      label: "Sparse fields",
      description: "Optional `fields[trips]` values",
      optional: true,
      options: TRIP_FIELD_OPTIONS,
    },
  },
  async run({ $ }) {
    const {
      tripId, tripFields,
    } = this;
    const body = await this.app.searchTrips({
      $,
      tripId,
      tripFields,
    });
    $.export("$summary", `Searched trips for \`${tripId}\``);
    return body;
  },
};
