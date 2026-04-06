import app from "../../avinode.app.mjs";

const SEARCH_FIELD_OPTIONS = [
  "amenities",
  "calculatedprice",
  "categorydetails",
  "flighttime",
  "homebase",
  "insurance",
  "liftaoc",
  "perfdetails",
  "safety",
  "sellercontactinfo",
  "sellerstats",
  "taildetails",
  "tailphotos",
  "typedetails",
  "typephotos",
];

export default {
  key: "avinode-search-empty-legs",
  name: "Search Empty Legs",
  description:
    "Run an empty leg marketplace search. [See the documentation](https://developer.avinodegroup.com/reference/create-emptyleg-search)",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    app,
    date: {
      type: "string",
      label: "Date",
      description: "Search date (`YYYY-MM-DD`)",
    },
    startAirportIcao: {
      type: "string",
      label: "Start airport ICAO",
      description: "Optional origin ICAO code",
      optional: true,
    },
    startAirportIata: {
      type: "string",
      label: "Start airport IATA",
      description: "Optional origin IATA code",
      optional: true,
    },
    startAirportFaa: {
      type: "string",
      label: "Start airport FAA",
      description: "Optional origin FAA code",
      optional: true,
    },
    endAirportIcao: {
      type: "string",
      label: "End airport ICAO",
      description: "Optional destination ICAO code",
      optional: true,
    },
    endAirportIata: {
      type: "string",
      label: "End airport IATA",
      description: "Optional destination IATA code",
      optional: true,
    },
    endAirportFaa: {
      type: "string",
      label: "End airport FAA",
      description: "Optional destination FAA code",
      optional: true,
    },
    numberOfDaysFlexibility: {
      type: "string",
      label: "Days flexibility",
      description: "Flexibility window in days around the search date",
      optional: true,
    },
    passengers: {
      type: "string",
      label: "Passengers",
      description: "Number of passengers",
      optional: true,
    },
    requiredPartnerships: {
      type: "string[]",
      label: "Required partnerships",
      description: "Enterprise only: partnership IDs",
      optional: true,
    },
    searchFields: {
      type: "string[]",
      label: "Sparse fields",
      description: "Optional `fields[search]` values",
      optional: true,
      options: SEARCH_FIELD_OPTIONS,
    },
  },
  async run({ $ }) {
    const {
      date,
      startAirportIcao,
      startAirportIata,
      startAirportFaa,
      endAirportIcao,
      endAirportIata,
      endAirportFaa,
      numberOfDaysFlexibility,
      passengers,
      requiredPartnerships,
      searchFields,
    } = this;
    const body = await this.app.searchEmptyLegs({
      $,
      date,
      startAirportIcao,
      startAirportIata,
      startAirportFaa,
      endAirportIcao,
      endAirportIata,
      endAirportFaa,
      numberOfDaysFlexibility,
      passengers,
      requiredPartnerships,
      searchFields,
    });
    $.export("$summary", "Empty leg search completed");
    return body;
  },
};
