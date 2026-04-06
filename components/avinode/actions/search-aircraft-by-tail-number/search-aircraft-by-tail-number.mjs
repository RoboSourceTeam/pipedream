import app from "../../avinode.app.mjs";

export default {
  key: "avinode-search-aircraft-by-tail-number",
  name: "Search Aircraft by Tail Number",
  description:
    "Search for aircraft by tail number. [See the documentation](https://developer.avinodegroup.com/reference/searchaircraft)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    tailNumbers: {
      type: "string[]",
      label: "Tail numbers",
      description: "One or more tail numbers (`tail` query param, repeated)",
    },
    aircraftFields: {
      type: "string[]",
      label: "Aircraft sparse fields",
      description: "Optional `fields[aircraft]` values",
      optional: true,
    },
    companyFields: {
      type: "string[]",
      label: "Company sparse fields",
      description: "Optional `fields[companies]` values",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      tailNumbers, aircraftFields, companyFields,
    } = this;
    const body = await this.app.searchAircraftByTailNumber({
      $,
      tailNumbers,
      aircraftFields,
      companyFields,
    });
    $.export(
      "$summary",
      `Searched aircraft for ${tailNumbers.length} tail number${tailNumbers.length === 1
        ? ""
        : "s"}`,
    );
    return body;
  },
};
