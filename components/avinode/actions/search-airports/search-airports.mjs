import app from "../../avinode.app.mjs";

export default {
  key: "avinode-search-airports",
  name: "Search Airports",
  description:
    "Search airports (paginated). Use responsibly per Avinode data policy. [See the documentation](https://developer.avinodegroup.com/reference/searchairports-1)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    filter: {
      type: "string",
      label: "Filter",
      description: "Airport search text",
      optional: true,
    },
    filterMatchType: {
      type: "string",
      label: "Filter match type",
      description: "How the filter string is matched",
      optional: true,
      default: "contains",
      options: [
        "contains",
        "starts_with",
      ],
    },
    pageNumber: {
      type: "integer",
      label: "Page number",
      description: "`page[number]` (1-based)",
      optional: true,
      default: 1,
      min: 1,
    },
    pageSize: {
      type: "integer",
      label: "Page size",
      description: "`page[size]`",
      optional: true,
      default: 50,
      min: 1,
      max: 200,
    },
  },
  async run({ $ }) {
    const {
      filter, filterMatchType, pageNumber, pageSize,
    } = this;
    const body = await this.app.searchAirports({
      $,
      filter,
      filterMatchType,
      pageNumber,
      pageSize,
    });
    const n = Array.isArray(body?.data)
      ? body.data.length
      : 0;
    $.export(
      "$summary",
      `Retrieved ${n} airport${n === 1
        ? ""
        : "s"}`,
    );
    return body;
  },
};
