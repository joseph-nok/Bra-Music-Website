/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as commerce from "../commerce.js";
import type * as content from "../content.js";
import type * as debug from "../debug.js";
import type * as events from "../events.js";
import type * as gallery from "../gallery.js";
import type * as invite from "../invite.js";
import type * as inviteEmail from "../inviteEmail.js";
import type * as market from "../market.js";
import type * as marketStock from "../marketStock.js";
import type * as music from "../music.js";
import type * as seed from "../seed.js";
import type * as setfooter from "../setfooter.js";
import type * as settings from "../settings.js";
import type * as team from "../team.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  commerce: typeof commerce;
  content: typeof content;
  debug: typeof debug;
  events: typeof events;
  gallery: typeof gallery;
  invite: typeof invite;
  inviteEmail: typeof inviteEmail;
  market: typeof market;
  marketStock: typeof marketStock;
  music: typeof music;
  seed: typeof seed;
  setfooter: typeof setfooter;
  settings: typeof settings;
  team: typeof team;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
