import app from "../../avinode.app.mjs";

const SEARCH_FIELD_OPTIONS = [
  "amenities",
  "categorydetails",
  "homebase",
  "insurance",
  "liftaoc",
  "metrics",
  "perfdetails",
  "safety",
  "schedule",
  "sellercontactinfo",
  "sellerstats",
  "startposition",
  "taildetails",
  "tailphotos",
  "typedetails",
  "typephotos",
];

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
  key: "avinode-search-availability",
  name: "Search Availability",
  description:
    "Run an availability search for an itinerary. [See the documentation](https://developer.avinodegroup.com/reference/createsearch)",
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
      description: "Trip itinerary array (or JSON string)",
    },
    criteria: {
      type: "any",
      label: "Criteria",
      description: "Optional criteria object (or JSON string)",
      optional: true,
    },
    outputCurrencies: {
      type: "string[]",
      label: "Output currencies",
      description: "Optional ISO3 currency codes",
      optional: true,
    },
    outputLiftPhotoTypes: {
      type: "string[]",
      label: "Output lift photo types",
      description: "Optional photo types",
      optional: true,
      options: [
        "EXTERIOR",
        "INTERIOR",
        "FLOORPLAN",
        "OVERVIEW",
        "OTHER",
      ],
    },
    includeUnavailable: {
      type: "boolean",
      label: "Include unavailable",
      description: "Include aircraft that appear unavailable on schedule",
      optional: true,
      default: false,
    },
    airAmbulanceSearch: {
      type: "boolean",
      label: "Air ambulance search",
      description: "Run an air-ambulance-specific availability search",
      optional: true,
      default: false,
    },
    fieldsSearches: {
      type: "string[]",
      label: "Sparse fields (searches)",
      description: "Optional `fields[searches]` values",
      optional: true,
      options: SEARCH_FIELD_OPTIONS,
    },
  },
  async run({ $ }) {
    const {
      segments,
      criteria,
      outputCurrencies,
      outputLiftPhotoTypes,
      includeUnavailable,
      airAmbulanceSearch,
      fieldsSearches,
    } = this;
    const seg = asData(segments, "Segments");
    const crit = asData(criteria, "Criteria");
    if (!Array.isArray(seg)) {
      throw new Error("segments must be an array");
    }
    const searchBody = this.app._stripUndefined({
      segments: seg,
      criteria: crit,
      outputCurrencies,
      outputLiftPhotoTypes,
      includeUnavailable,
      airAmbulanceSearch,
    });
    const body = await this.app.searchAvailability({
      $,
      body: searchBody,
      fieldsSearches,
    });
    $.export("$summary", "Availability search completed");
    return body;
  },
};
