import app from "../../avinode.app.mjs";

export default {
  key: "avinode-get-rfq",
  name: "Get RFQ",
  description:
    "Read a single RFQ by ID. [See the documentation](https://developer.avinodegroup.com/reference/readbynumericid)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    rfqId: {
      type: "string",
      label: "RFQ ID",
      description: "Numeric or string RFQ identifier",
    },
    rfqFields: {
      type: "string[]",
      label: "RFQ sparse fields",
      description: "Optional `fields[rfqs]` values",
      optional: true,
    },
    airportFields: {
      type: "string[]",
      label: "Airport sparse fields",
      description: "Optional `fields[airports]` values",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      rfqId, rfqFields, airportFields,
    } = this;
    const body = await this.app.getRfq({
      $,
      rfqId,
      rfqFields,
      airportFields,
    });
    $.export("$summary", `Retrieved RFQ \`${rfqId}\``);
    return body;
  },
};
