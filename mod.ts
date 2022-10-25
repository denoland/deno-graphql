import {
  GQLOptions,
  runHttpQuery,
} from "https://deno.land/x/gql@1.1.1/common.ts";
import { renderPlaygroundPage } from "https://deno.land/x/gql@1.1.1/graphiql/render.ts";
import type { GQLRequest } from "https://deno.land/x/gql@1.1.1/types.ts";

// !!! all code below is from https://deno.land/x/gql@1.1.1/http.ts
// except for removal of dynamic import

/**
 * Create a new GraphQL HTTP middleware with schema, context etc
 * @param {GQLOptions} options
 *
 * @example
 * ```ts
 * const graphql = await GraphQLHTTP({ schema })
 *
 * for await (const req of s) graphql(req)
 * ```
 */
export function GraphQLHTTP<
  Req extends GQLRequest = GQLRequest,
  Ctx extends { request: Req } = { request: Req },
>({ playgroundOptions = {}, headers = {}, ...options }: GQLOptions<Ctx, Req>) {
  return async (request: Req) => {
    if (options.graphiql && request.method === "GET") {
      if (request.headers.get("Accept")?.includes("text/html")) {
        // !!! only modified portion is here
        // const { renderPlaygroundPage } = await import(
        // 	"./graphiql/render.ts"
        // );
        // !!! end of modified portion
        const playground = renderPlaygroundPage({
          ...playgroundOptions,
          endpoint: "/graphql",
        });

        return new Response(playground, {
          headers: new Headers({
            "Content-Type": "text/html",
            ...headers,
          }),
        });
      } else {
        return new Response('"Accept" header value must include text/html', {
          status: 400,

          headers: new Headers(headers),
        });
      }
    } else {
      if (!["PUT", "POST", "PATCH"].includes(request.method)) {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: new Headers(headers),
        });
      } else {
        try {
          const result = await runHttpQuery<Req, Ctx>(
            await request.json(),
            options,
            { request },
          );

          return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: new Headers({
              "Content-Type": "application/json",
              ...headers,
            }),
          });
        } catch (e) {
          console.error(e);
          return new Response("Malformed request body", {
            status: 400,
            headers: new Headers(headers),
          });
        }
      }
    }
  };
}
