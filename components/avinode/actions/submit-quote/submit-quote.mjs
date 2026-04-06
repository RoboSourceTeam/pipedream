import app from "../../avinode.app.mjs";

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
  key: "avinode-submit-quote",
  name: "Submit Quote",
  description:
    "Submit a seller quote for a trip request. [See the documentation](https://developer.avinodegroup.com/reference/submitquote)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    app,
    requestId: {
      type: "string",
      label: "Request ID",
      description: "Trip message / request ID to submit a quote for",
    },
    message: {
      type: "string",
      label: "Message",
      description: "Optional message to the buyer",
      optional: true,
    },
    suppressNotification: {
      type: "boolean",
      label: "Suppress notification",
      description: "If true, Avinode will not notify the buyer",
      optional: true,
      default: false,
    },
    quoteSegments: {
      type: "any",
      label: "Quote segments",
      description: "Quoted segments array (or JSON string); see `AircraftSellerQuoteSegmentInputImpl`",
    },
    quoteAircraftCategory: {
      type: "string",
      label: "Quote aircraft category",
      description: "Provide one of category, type, or tail for `quote.lift`",
      optional: true,
    },
    quoteAircraftType: {
      type: "string",
      label: "Quote aircraft type",
      description: "Aircraft type for `quote.lift`",
      optional: true,
    },
    quoteAircraftTail: {
      type: "string",
      label: "Quote aircraft tail",
      description: "Tail number for `quote.lift`",
      optional: true,
    },
    currencyCode: {
      type: "string",
      label: "Currency code",
      description: "ISO currency code (for example USD)",
    },
    totalPrice: {
      type: "string",
      label: "Total price",
      description: "Total price the buyer pays (numeric string or number)",
    },
    messageForBuyer: {
      type: "string",
      label: "Message for buyer",
      description: "Price information shown to the buyer",
      optional: true,
    },
    sellerUniqueQuoteIdentifier: {
      type: "string",
      label: "Seller unique quote ID",
      description: "External unique ID from your system",
      optional: true,
    },
    lineItems: {
      type: "any",
      label: "Line items",
      description: "Optional line items array (or JSON string)",
      optional: true,
    },
    attachments: {
      type: "any",
      label: "Attachments",
      description: "Optional attachments array (or JSON string)",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      requestId,
      message,
      suppressNotification,
      quoteSegments,
      quoteAircraftCategory,
      quoteAircraftType,
      quoteAircraftTail,
      currencyCode,
      totalPrice,
      messageForBuyer,
      sellerUniqueQuoteIdentifier,
      lineItems,
      attachments,
    } = this;
    const segments = asData(quoteSegments, "Quote segments");
    if (!Array.isArray(segments)) {
      throw new Error("quoteSegments must be an array");
    }
    const lift = this.app._stripUndefined({
      aircraftCategory: quoteAircraftCategory?.toString?.()?.trim(),
      aircraftType: quoteAircraftType?.toString?.()?.trim(),
      aircraftTail: quoteAircraftTail?.toString?.()?.trim(),
    });
    if (Object.keys(lift).length === 0) {
      throw new Error(
        "Provide at least one of quoteAircraftCategory, quoteAircraftType, or quoteAircraftTail",
      );
    }
    const total = Number(totalPrice);
    if (Number.isNaN(total)) {
      throw new Error("totalPrice must be a number");
    }
    const items = asData(lineItems, "Line items");
    const atts = asData(attachments, "Attachments");
    if (items !== undefined && !Array.isArray(items)) {
      throw new Error("lineItems must be an array");
    }
    if (atts !== undefined && !Array.isArray(atts)) {
      throw new Error("attachments must be an array");
    }
    const quote = this.app._stripUndefined({
      segments,
      lift,
      currencyCode: currencyCode?.toString?.()?.trim(),
      totalPrice: total,
      messageForBuyer: messageForBuyer?.toString?.(),
      sellerUniqueQuoteIdentifier: sellerUniqueQuoteIdentifier?.toString?.()?.trim(),
      lineItems: items,
      attachments: atts,
    });
    const payload = this.app._stripUndefined({
      message: message?.toString?.(),
      suppressNotification,
      quote,
    });
    const body = await this.app.submitQuote({
      $,
      requestId,
      ...payload,
    });
    $.export("$summary", `Submitted quote for request \`${requestId}\``);
    return body;
  },
};
