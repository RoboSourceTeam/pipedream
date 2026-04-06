import app from "../../avinode.app.mjs";

export default {
  key: "avinode-get-empty-leg",
  name: "Get Empty Leg",
  description:
    "Read a single empty leg. [See the documentation](https://developer.avinodegroup.com/reference/getemptyleg)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    emptyLegId: {
      type: "string",
      label: "Empty leg ID",
      description: "Empty leg identifier",
    },
    fields: {
      type: "string[]",
      label: "Sparse fields",
      description: "Optional `fields[emptylegs]` values",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      emptyLegId, fields,
    } = this;
    const body = await this.app.getEmptyLeg({
      $,
      emptyLegId,
      fields,
    });
    $.export("$summary", `Retrieved empty leg \`${emptyLegId}\``);
    return body;
  },
};
