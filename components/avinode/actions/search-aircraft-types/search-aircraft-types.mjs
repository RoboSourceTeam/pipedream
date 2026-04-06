import app from "../../avinode.app.mjs";

const TYPE_FIELD_OPTIONS = [
  "perfdetails",
  "typedetails",
  "typephotos",
];

export default {
  key: "avinode-search-aircraft-types",
  name: "Search Aircraft Types",
  description:
    "Search aircraft types (single page). [See the documentation](https://developer.avinodegroup.com/reference/searchaircrafttypes)",
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
      description: "Search criteria text",
      optional: true,
    },
    pageSize: {
      type: "integer",
      label: "Page size",
      description: "`page[size]`",
      optional: true,
      min: 1,
    },
    fixedWing: {
      type: "boolean",
      label: "Include fixed wing",
      description: "Include fixed-wing aircraft types",
      optional: true,
    },
    helicopter: {
      type: "boolean",
      label: "Include helicopter",
      description: "Include helicopter types",
      optional: true,
    },
    fuzzy: {
      type: "boolean",
      label: "Fuzzy matching",
      description: "Use fuzzy text matching on the filter",
      optional: true,
    },
    fields: {
      type: "string[]",
      label: "Sparse fields",
      description: "Optional `fields[aircrafttypes]` values",
      optional: true,
      options: TYPE_FIELD_OPTIONS,
    },
  },
  async run({ $ }) {
    const {
      filter, pageSize, fixedWing, helicopter, fuzzy, fields,
    } = this;
    const body = await this.app.searchAircraftTypes({
      $,
      filter,
      pageSize,
      fixedWing,
      helicopter,
      fuzzy,
      fields,
    });
    const n = Array.isArray(body?.data)
      ? body.data.length
      : 0;
    $.export(
      "$summary",
      `Retrieved ${n} aircraft type${n === 1
        ? ""
        : "s"}`,
    );
    return body;
  },
};
