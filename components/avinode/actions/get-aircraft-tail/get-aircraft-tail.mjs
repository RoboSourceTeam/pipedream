import app from "../../avinode.app.mjs";

export default {
  key: "avinode-get-aircraft-tail",
  name: "Get Aircraft Tail",
  description:
    "Read a single aircraft by prefixed ID. [See the documentation](https://developer.avinodegroup.com/reference/readaircraft)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    aircraftId: {
      type: "string",
      label: "Aircraft ID",
      description: "Prefixed aircraft identifier from Avinode",
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
      aircraftId, aircraftFields, companyFields,
    } = this;
    const body = await this.app.getAircraftTail({
      $,
      aircraftId,
      aircraftFields,
      companyFields,
    });
    $.export("$summary", `Retrieved aircraft \`${aircraftId}\``);
    return body;
  },
};
