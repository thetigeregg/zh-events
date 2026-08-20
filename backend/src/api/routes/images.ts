import type { FastifyInstance } from "fastify";
import { IMAGE_HASH_PATTERN, getOrFetchImage } from "../../images/cache.js";

export function registerImagesRoute(app: FastifyInstance) {
  app.get<{ Params: { hash: string } }>("/api/images/:hash", async (request, reply) => {
    const { hash } = request.params;
    if (!IMAGE_HASH_PATTERN.test(hash)) {
      return reply.status(400).send({ error: "invalid image hash" });
    }

    const result = await getOrFetchImage(app.db, hash);
    if (result.kind === "not_found") {
      return reply.status(404).send({ error: "not found" });
    }
    if (result.kind === "upstream_error") {
      return reply.status(502).send({ error: "upstream image fetch failed" });
    }

    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.type(result.image.contentType);
    return reply.send(result.image.data);
  });
}
