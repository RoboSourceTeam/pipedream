import app from "../../avinode.app.mjs";

export default {
  key: "avinode-list-fleet-schedules",
  name: "List Fleet Schedules",
  description:
    "Read schedules for all aircraft in your fleet. [See the documentation](https://developer.avinodegroup.com/reference/readschedule)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    app,
    startTimestamp: {
      type: "string",
      label: "Start timestamp",
      description: "Optional filter start (`startts`, ISO 8601 UTC)",
      optional: true,
    },
    endTimestamp: {
      type: "string",
      label: "End timestamp",
      description: "Optional filter end (`endts`, ISO 8601 UTC)",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      startTimestamp, endTimestamp,
    } = this;
    const body = await this.app.listFleetSchedules({
      $,
      startTimestamp,
      endTimestamp,
    });
    $.export("$summary", "Retrieved fleet schedules");
    return body;
  },
};
