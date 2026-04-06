import { axios } from "@pipedream/platform";

export default {
  type: "app",
  app: "avinode",
  propDefinitions: {
    airportId: {
      type: "string",
      label: "Airport ID",
      description:
        "Search by name or code, pick from the list, or enter an ID manually. [Search airports](https://developer.avinodegroup.com/reference/searchairports-1)",
      useQuery: true,
      async options({
        $, query, prevContext,
      }) {
        const pageSize = 50;
        const pageNumber = prevContext?.nextPageNumber ?? 1;
        const body = await this.searchAirports({
          $,
          filter: query,
          pageNumber,
          pageSize,
        });

        const airports = Array.isArray(body?.data)
          ? body.data
          : [];
        const pag = body?.meta?.pagination;
        const batchSize = pag?.batchSize ?? pageSize;
        const currentPage = pag?.pageNumber ?? pageNumber;
        const totalCount = pag?.totalCount;

        let nextPageNumber;
        if (typeof totalCount === "number" && airports.length > 0) {
          const loaded = (currentPage - 1) * batchSize + airports.length;
          if (loaded < totalCount && airports.length >= Math.min(batchSize, pageSize)) {
            nextPageNumber = currentPage + 1;
          }
        } else if (airports.length >= pageSize) {
          nextPageNumber = pageNumber + 1;
        }

        const options = airports.map((a) => {
          const label =
            a.displayName
            || [
              a.displayCodes,
              a.name,
            ]
              .filter(Boolean)
              .join(" — ")
            || String(a.id);
          return {
            value: String(a.id),
            label,
          };
        });

        return {
          options,
          context: nextPageNumber
            ? {
              nextPageNumber,
            }
            : {},
        };
      },
    },
  },
  methods: {
    /**
     * API base URL (no trailing slash).
     * Uses `base_url` from the connected account or the Avinode sandbox default.
     */
    _baseUrl() {
      const raw =
        this.$auth.base_url?.toString?.() || "https://sandbox.avinode.com/api";
      return raw.replace(/\/+$/, "");
    },
    /**
     * Headers required by Avinode Marketplace / Trip Manager APIs.
     */
    _headers() {
      const accessToken = this.$auth.access_token?.toString?.();
      const apiToken = this.$auth.api_token?.toString?.();
      if (!accessToken) {
        throw new Error(
          "Authentication token is required. Add it in your Avinode connected account.",
        );
      }
      if (!apiToken) {
        throw new Error(
          "API token (X-Avinode-ApiToken) is required. Add it in your Avinode connected account.",
        );
      }
      const productName =
        this.$auth.product_name?.toString?.() || "Pipedream/1.0";
      const headers = {
        "Authorization": `Bearer ${accessToken}`,
        "X-Avinode-ApiToken": apiToken,
        "X-Avinode-Product": productName,
        "X-Avinode-SentTimestamp": new Date().toISOString(),
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      const actAs = this.$auth.act_as_account?.toString?.();
      if (actAs) {
        headers["X-Avinode-ActAsAccount"] = actAs;
      }
      return headers;
    },
    /**
     * @param {object} opts
     * @param {*} [opts.$] - Pipedream context (`$`) for axios
     * @param {string} opts.path - Path beginning with `/`
     * @param {string} [opts.method]
     * @param {object} [opts.data]
     * @param {object} [opts.params] - Query string params (use `path` for repeated keys)
     */
    async _makeRequest({
      $ = this,
      path,
      method = "GET",
      data,
      params,
      ...args
    }) {
      const base = this._baseUrl();
      const p = path.startsWith("/")
        ? path
        : `/${path}`;
      return axios($, {
        url: `${base}${p}`,
        method,
        headers: this._headers(),
        data,
        params,
        ...args,
      });
    },
    /**
     * Remove keys whose values are `undefined`, `null`, or `""` (shallow object only).
     */
    _stripUndefined(obj) {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        return obj;
      }
      return Object.fromEntries(
        Object.entries(obj).filter(([
          , v,
        ]) => v !== undefined && v !== null && v !== ""),
      );
    },
    _airportCodes({
      icao,
      iata,
      faa,
    } = {}) {
      return this._stripUndefined({
        icao: icao?.toString?.()?.trim() || undefined,
        iata: iata?.toString?.()?.trim() || undefined,
        faa: faa?.toString?.()?.trim() || undefined,
      });
    },
    /**
     * List all aircraft types (GET /aircrafttypes), following paginated results until exhausted.
     * @see https://developer.avinodegroup.com/reference/listaircrafttypes
     * @param {object} [opts]
     * @param {*} [opts.$]
     * @param {number} [opts.pageSize] - Batch size per request (page[size])
     * @param {string[]} [opts.fields] - Sparse fields: perfdetails, typedetails, typephotos
     * @returns {Promise<object[]>} Combined `data` items from all pages
     */
    async listAircraftTypes({
      $ = this,
      pageSize = 100,
      fields,
    } = {}) {
      const all = [];
      let pageNumber = 1;
      const maxPages = 500;

      for (let i = 0; i < maxPages; i++) {
        const sp = new URLSearchParams();
        sp.set("page[size]", String(pageSize));
        sp.set("page[number]", String(pageNumber));
        for (const f of fields || []) {
          sp.append("fields[aircrafttypes]", String(f));
        }

        const body = await this._makeRequest({
          $,
          path: `/aircrafttypes?${sp.toString()}`,
        });

        const batch = Array.isArray(body?.data)
          ? body.data
          : [];
        if (batch.length === 0) {
          break;
        }
        all.push(...batch);

        const pag = body?.meta?.pagination;
        if (pag && typeof pag.totalCount === "number") {
          if (all.length >= pag.totalCount) {
            break;
          }
          const reportedSize = pag.batchSize ?? pageSize;
          if (batch.length < reportedSize) {
            break;
          }
        } else if (batch.length < pageSize) {
          break;
        }

        pageNumber += 1;
      }

      return all;
    },
    /**
     * Search airports (GET /airports/search).
     * @see https://developer.avinodegroup.com/reference/searchairports-1
     * @param {object} [opts]
     * @param {*} [opts.$]
     * @param {string} [opts.filter] - Search criteria (`filter` query param)
     * @param {"contains"|"starts_with"} [opts.filterMatchType] - Default `contains`
     * @param {number} [opts.pageNumber] - `page[number]` (1-based)
     * @param {number} [opts.pageSize] - `page[size]`
     * @returns {Promise<object>} Parsed JSON body (`data`, `meta`, …)
     */
    async searchAirports({
      $ = this,
      filter,
      filterMatchType = "contains",
      pageNumber = 1,
      pageSize = 50,
    } = {}) {
      const sp = new URLSearchParams();
      const q = filter?.toString?.()?.trim();
      if (q) {
        sp.set("filter", q);
      }
      sp.set("filterMatchType", filterMatchType);
      sp.set("page[number]", String(pageNumber));
      sp.set("page[size]", String(pageSize));

      return this._makeRequest({
        $,
        path: `/airports/search?${sp.toString()}`,
      });
    },
    /**
     * Read a single airport (GET /airports/{airportId}).
     * @see https://developer.avinodegroup.com/reference/readairport-1
     * @param {object} opts
     * @param {*} [opts.$]
     * @param {string} opts.airportId - Airport identifier
     * @returns {Promise<object>} Parsed JSON response body
     */
    async getAirport({
      $ = this,
      airportId,
    } = {}) {
      const id = airportId?.toString?.()?.trim();
      if (!id) {
        throw new Error("airportId is required");
      }
      return this._makeRequest({
        $,
        path: `/airports/${encodeURIComponent(id)}`,
      });
    },
    /**
     * Cancel a trip (PUT /trips/{id}/cancel).
     * @see https://developer.avinodegroup.com/reference/canceltrip_1
     */
    async cancelTrip({
      $ = this,
      tripId,
      messageToSeller,
      reason = "OTHER",
    } = {}) {
      const id = tripId?.toString?.()?.trim();
      if (!id) {
        throw new Error("tripId is required");
      }
      return this._makeRequest({
        $,
        method: "PUT",
        path: `/trips/${encodeURIComponent(id)}/cancel`,
        data: this._stripUndefined({
          id,
          messageToSeller: messageToSeller?.toString?.()?.trim(),
          reason,
        }),
      });
    },
    /**
     * Create a trip (POST /trips).
     * @see https://developer.avinodegroup.com/reference/createtrip
     */
    async createTrip({
      $ = this,
      ...body
    } = {}) {
      return this._makeRequest({
        $,
        method: "POST",
        path: "/trips",
        data: body,
      });
    },
    /**
     * Update a trip (PUT /trips/{id}).
     * @see https://developer.avinodegroup.com/reference/updatetripbynumericid
     */
    async updateTrip({
      $ = this,
      tripId,
      ...body
    } = {}) {
      const id = tripId?.toString?.()?.trim();
      if (!id) {
        throw new Error("tripId is required");
      }
      const rest = {
        ...body,
      };
      delete rest.id;
      return this._makeRequest({
        $,
        method: "PUT",
        path: `/trips/${encodeURIComponent(id)}`,
        data: {
          id,
          ...rest,
        },
      });
    },
    /**
     * Read a trip (GET /trips/{id}).
     * @see https://developer.avinodegroup.com/reference/readtrip_1
     */
    async getTrip({
      $ = this,
      tripId,
      tripFields,
    } = {}) {
      const id = tripId?.toString?.()?.trim();
      if (!id) {
        throw new Error("tripId is required");
      }
      const sp = new URLSearchParams();
      for (const f of tripFields || []) {
        sp.append("fields[trips]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/trips/${encodeURIComponent(id)}?${q}`
          : `/trips/${encodeURIComponent(id)}`,
      });
    },
    /**
     * Search trips by identifier (GET /trips/searchTrips).
     * @see https://developer.avinodegroup.com/reference/searchtrips
     */
    async searchTrips({
      $ = this,
      tripId,
      tripFields,
    } = {}) {
      const id = tripId?.toString?.()?.trim();
      if (!id) {
        throw new Error("tripId is required");
      }
      const sp = new URLSearchParams();
      sp.set("id", id);
      for (const f of tripFields || []) {
        sp.append("fields[trips]", String(f));
      }
      return this._makeRequest({
        $,
        path: `/trips/searchTrips?${sp.toString()}`,
      });
    },
    /**
     * List RFQs sent to your company (GET /rfqs).
     * @see https://developer.avinodegroup.com/reference/list
     */
    async listRfqs({
      $ = this,
      pageFirstSeek,
      pageSeek,
      pageSize,
      fields,
    } = {}) {
      const sp = new URLSearchParams();
      if (pageFirstSeek != null) {
        sp.set("page[firstseek]", String(pageFirstSeek));
      }
      if (pageSeek != null) {
        sp.set("page[seek]", String(pageSeek));
      }
      if (pageSize != null) {
        sp.set("page[size]", String(pageSize));
      }
      for (const f of fields || []) {
        sp.append("fields[rfqs]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/rfqs?${q}`
          : "/rfqs",
      });
    },
    /**
     * Read a single RFQ (GET /rfqs/{id}).
     * @see https://developer.avinodegroup.com/reference/readbynumericid
     */
    async getRfq({
      $ = this,
      rfqId,
      rfqFields,
      airportFields,
    } = {}) {
      const id = rfqId?.toString?.()?.trim();
      if (!id) {
        throw new Error("rfqId is required");
      }
      const sp = new URLSearchParams();
      for (const f of rfqFields || []) {
        sp.append("fields[rfqs]", String(f));
      }
      for (const f of airportFields || []) {
        sp.append("fields[airports]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/rfqs/${encodeURIComponent(id)}?${q}`
          : `/rfqs/${encodeURIComponent(id)}`,
      });
    },
    /**
     * Create an RFQ (POST /rfqs).
     * @see https://developer.avinodegroup.com/reference/createrfq_1
     */
    async createRfq({
      $ = this,
      ...body
    } = {}) {
      return this._makeRequest({
        $,
        method: "POST",
        path: "/rfqs",
        data: body,
      });
    },
    /**
     * Submit a quote to the buyer (POST /tripmsgs/{requestId}/submitQuote).
     * @see https://developer.avinodegroup.com/reference/submitquote
     */
    async submitQuote({
      $ = this,
      requestId,
      ...body
    } = {}) {
      const rid = requestId?.toString?.()?.trim();
      if (!rid) {
        throw new Error("requestId is required");
      }
      return this._makeRequest({
        $,
        method: "POST",
        path: `/tripmsgs/${encodeURIComponent(rid)}/submitQuote`,
        data: body,
      });
    },
    /**
     * Read schedules for all fleet aircraft (GET /schedules).
     * @see https://developer.avinodegroup.com/reference/readschedule
     */
    async listFleetSchedules({
      $ = this,
      startTimestamp,
      endTimestamp,
    } = {}) {
      const sp = new URLSearchParams();
      if (startTimestamp != null && String(startTimestamp).trim() !== "") {
        sp.set("startts", String(startTimestamp).trim());
      }
      if (endTimestamp != null && String(endTimestamp).trim() !== "") {
        sp.set("endts", String(endTimestamp).trim());
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/schedules?${q}`
          : "/schedules",
      });
    },
    /**
     * Run an availability search (POST /searches).
     * @see https://developer.avinodegroup.com/reference/createsearch
     */
    async searchAvailability({
      $ = this,
      body,
      fieldsSearches,
    } = {}) {
      const sp = new URLSearchParams();
      for (const f of fieldsSearches || []) {
        sp.append("fields[searches]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        method: "POST",
        path: q
          ? `/searches?${q}`
          : "/searches",
        data: body,
      });
    },
    /**
     * Search aircraft by tail number (GET /aircraft/search).
     * @see https://developer.avinodegroup.com/reference/searchaircraft
     */
    async searchAircraftByTailNumber({
      $ = this,
      tailNumbers,
      aircraftFields,
      companyFields,
    } = {}) {
      const tails = Array.isArray(tailNumbers)
        ? tailNumbers
        : [];
      if (tails.length === 0) {
        throw new Error("At least one tail number is required");
      }
      const sp = new URLSearchParams();
      for (const t of tails) {
        sp.append("tail", String(t).trim());
      }
      for (const f of aircraftFields || []) {
        sp.append("fields[aircraft]", String(f));
      }
      for (const f of companyFields || []) {
        sp.append("fields[companies]", String(f));
      }
      return this._makeRequest({
        $,
        path: `/aircraft/search?${sp.toString()}`,
      });
    },
    /**
     * Read a single aircraft by prefixed ID (GET /aircraft/{aircraftId}).
     * @see https://developer.avinodegroup.com/reference/readaircraft
     */
    async getAircraftTail({
      $ = this,
      aircraftId,
      aircraftFields,
      companyFields,
    } = {}) {
      const id = aircraftId?.toString?.()?.trim();
      if (!id) {
        throw new Error("aircraftId is required");
      }
      const sp = new URLSearchParams();
      for (const f of aircraftFields || []) {
        sp.append("fields[aircraft]", String(f));
      }
      for (const f of companyFields || []) {
        sp.append("fields[companies]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/aircraft/${encodeURIComponent(id)}?${q}`
          : `/aircraft/${encodeURIComponent(id)}`,
      });
    },
    /**
     * Search aircraft types (GET /aircrafttypes/search).
     * @see https://developer.avinodegroup.com/reference/searchaircrafttypes
     */
    async searchAircraftTypes({
      $ = this,
      filter,
      pageSize,
      fixedWing,
      helicopter,
      fuzzy,
      fields,
    } = {}) {
      const sp = new URLSearchParams();
      const f = filter?.toString?.()?.trim();
      if (f) {
        sp.set("filter", f);
      }
      if (pageSize != null) {
        sp.set("page[size]", String(pageSize));
      }
      if (fixedWing != null) {
        sp.set("fixedWing", String(fixedWing));
      }
      if (helicopter != null) {
        sp.set("helicopter", String(helicopter));
      }
      if (fuzzy != null) {
        sp.set("fuzzy", String(fuzzy));
      }
      for (const fld of fields || []) {
        sp.append("fields[aircrafttypes]", String(fld));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/aircrafttypes/search?${q}`
          : "/aircrafttypes/search",
      });
    },
    /**
     * Create an empty leg (POST /emptylegs).
     * @see https://developer.avinodegroup.com/reference/createemptyleg
     */
    async createEmptyLeg({
      $ = this,
      aircraftCategory,
      aircraftType,
      aircraftTail,
      startAirportIcao,
      startAirportIata,
      startAirportFaa,
      endAirportIcao,
      endAirportIata,
      endAirportFaa,
      startDate,
      endDate,
      published,
      sellerMessage,
      sellerVerified,
      sellerPrice,
      sellerPriceCurrency,
    } = {}) {
      const sd = startDate?.toString?.()?.trim();
      const ed = endDate?.toString?.()?.trim();
      if (!sd || !ed) {
        throw new Error("startDate and endDate are required");
      }
      const lift = this._stripUndefined({
        aircraftCategory: aircraftCategory?.toString?.()?.trim(),
        aircraftType: aircraftType?.toString?.()?.trim(),
        aircraftTail: aircraftTail?.toString?.()?.trim(),
      });
      const data = {
        lift,
        startAirport: this._airportCodes({
          icao: startAirportIcao,
          iata: startAirportIata,
          faa: startAirportFaa,
        }),
        endAirport: this._airportCodes({
          icao: endAirportIcao,
          iata: endAirportIata,
          faa: endAirportFaa,
        }),
        startDate: sd,
        endDate: ed,
        ...this._stripUndefined({
          published,
          sellerMessage: sellerMessage?.toString?.(),
          sellerVerified,
          sellerPrice: sellerPrice?.toString?.()?.trim(),
          sellerPriceCurrency: sellerPriceCurrency?.toString?.()?.trim(),
        }),
      };
      return this._makeRequest({
        $,
        method: "POST",
        path: "/emptylegs",
        data,
      });
    },
    /**
     * Read a single empty leg (GET /emptylegs/{emptyLegId}).
     * @see https://developer.avinodegroup.com/reference/getemptyleg
     */
    async getEmptyLeg({
      $ = this,
      emptyLegId,
      fields,
    } = {}) {
      const id = emptyLegId?.toString?.()?.trim();
      if (!id) {
        throw new Error("emptyLegId is required");
      }
      const sp = new URLSearchParams();
      for (const f of fields || []) {
        sp.append("fields[emptylegs]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        path: q
          ? `/emptylegs/${encodeURIComponent(id)}?${q}`
          : `/emptylegs/${encodeURIComponent(id)}`,
      });
    },
    /**
     * Run an empty leg search (POST /emptylegs/search).
     * @see https://developer.avinodegroup.com/reference/create-emptyleg-search
     */
    async searchEmptyLegs({
      $ = this,
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
    } = {}) {
      const d = date?.toString?.()?.trim();
      if (!d) {
        throw new Error("date is required (YYYY-MM-DD)");
      }
      const body = this._stripUndefined({
        startAirport: this._airportCodes({
          icao: startAirportIcao,
          iata: startAirportIata,
          faa: startAirportFaa,
        }),
        endAirport: this._airportCodes({
          icao: endAirportIcao,
          iata: endAirportIata,
          faa: endAirportFaa,
        }),
        date: d,
        numberOfDaysFlexibility: numberOfDaysFlexibility?.toString?.()?.trim(),
        passengers: passengers?.toString?.()?.trim(),
        requiredPartnerships,
      });
      const sp = new URLSearchParams();
      for (const f of searchFields || []) {
        sp.append("fields[search]", String(f));
      }
      const q = sp.toString();
      return this._makeRequest({
        $,
        method: "POST",
        path: q
          ? `/emptylegs/search?${q}`
          : "/emptylegs/search",
        data: body,
      });
    },
  },
};
