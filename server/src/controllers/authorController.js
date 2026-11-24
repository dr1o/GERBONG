import authorModel from "../models/authorModel.js";

const IGNORED_FIELDS = new Set(["id", "created_at", "updated_at", "works"]);

function buildAuthorPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const payload = {};

  for (const [key, value] of Object.entries(body)) {
    if (IGNORED_FIELDS.has(key) || value === undefined) continue;
    payload[key] = key === "name" && typeof value === "string" ? value.trim() : value;
  }

  return payload;
}

export const authorController = {
  async getAll(req, res, next) {
    try {
      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : typeof req.query.q === "string"
            ? req.query.q.trim()
            : "";

      const authors = await authorModel.getAll(search ? { search } : {});
      return res.status(200).json(authors);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const author = await authorModel.getById(req.params.id);

      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }

      return res.status(200).json(author);
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = buildAuthorPayload(req.body);

      if (!payload || typeof payload.name !== "string" || payload.name.length === 0) {
        return res.status(400).json({ error: "Field 'name' is required" });
      }

      const created = await authorModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const payload = buildAuthorPayload(req.body);

      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({ error: "Request body cannot be empty" });
      }

      if (
        payload.name !== undefined &&
        (typeof payload.name !== "string" || payload.name.length === 0)
      ) {
        return res.status(400).json({ error: "Field 'name' must be a non-empty string" });
      }

      const updated = await authorModel.update(req.params.id, payload);

      if (!updated) {
        return res.status(404).json({ error: "Author not found" });
      }

      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await authorModel.remove(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Author not found" });
      }

      return res.status(200).json({
        message: "Author deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

export default authorController;
