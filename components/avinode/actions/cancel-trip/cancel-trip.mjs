import app from "../../avinode.app.mjs";

export default {
  key: "avinode-cancel-trip",
  name: "Cancel Trip",
  description:
    "Cancel a trip and its associated RFQs. [See the documentation](https://developer.avinodegroup.com/reference/canceltrip_1)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: true,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    app,
    tripId: {
      type: "string",
      label: "Trip ID",
      description: "Avinode trip identifier (for example `atrip-1000000137`)",
    },
    messageToSeller: {
      type: "string",
      label: "Message to seller",
      description: "Cancellation message sent to the seller or operator",
      optional: true,
    },
    reason: {
      type: "string",
      label: "Cancellation reason",
      description: "Reason code for the cancellation",
      optional: true,
      default: "OTHER",
      options: [
        "BY_CLIENT",
        "CHANGED",
        "BOOKED",
        "OTHER",
      ],
    },
  },
  async run({ $ }) {
    const {
      tripId, messageToSeller, reason,
    } = this;
    const body = await this.app.cancelTrip({
      $,
      tripId,
      messageToSeller,
      reason,
    });
    $.export("$summary", `Canceled trip \`${tripId}\``);
    return body;
  },
};
