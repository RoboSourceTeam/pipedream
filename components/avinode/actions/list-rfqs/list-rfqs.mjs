import app from "../../avinode.app.mjs";

export default {
  key: "avinode-list-rfqs",
  name: "List RFQs",
  description:
    "List requests-for-quotes (RFQs) sent to your company. [See the documentation](https://developer.avinodegroup.com/reference/list)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    pageFirstSeek: {
      type: "string",
      label: "Page first seek",
      description: "Pagination `page[firstseek]` (ISO 8601 timestamp)",
      optional: true,
    },
    pageSeek: {
      type: "string",
      label: "Page seek",
      description: "Pagination `page[seek]` (last ID from the previous page)",
      optional: true,
    },
    pageSize: {
      type: "integer",
      label: "Page size",
      description: "Pagination `page[size]`",
      optional: true,
      min: 1,
    },
    fields: {
      type: "string[]",
      label: "RFQ sparse fields",
      description: "Optional `fields[rfqs]` values",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      pageFirstSeek, pageSeek, pageSize, fields,
    } = this;
    const body = await this.app.listRfqs({
      $,
      pageFirstSeek,
      pageSeek,
      pageSize,
      fields,
    });
    const n = Array.isArray(body?.data)
      ? body.data.length
      : undefined;
    $.export(
      "$summary",
      typeof n === "number"
        ? `Retrieved ${n} RFQ${n === 1
          ? ""
          : "s"}`
        : "Listed RFQs",
    );
    return body;
  },
};
