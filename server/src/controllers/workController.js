import workModel from "../models/workModel.js";

const IGNORED_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "authors",
  "categories",
]);
const NULLABLE_FK_FIELDS = new Set(["author_id", "category_id"]);
const TRIMMED_STRING_FIELDS = new Set(["title", "magnet_uri"]);

function buildWorkPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const payload = {};

  for (const [key, value] of Object.entries(body)) {
    if (IGNORED_FIELDS.has(key) || value === undefined) continue;

    if (NULLABLE_FK_FIELDS.has(key) && value === "") {
      payload[key] = null;
      continue;
    }

    if (TRIMMED_STRING_FIELDS.has(key) && typeof value === "string") {
      payload[key] = value.trim();
      continue;
    }

    payload[key] = value;
  }

  return payload;
}

export const workController = {
  async getAll(req, res, next) {
    try {
      const filters = {};

      if (typeof req.query.author_id === "string" && req.query.author_id.trim()) {
        filters.author_id = req.query.author_id.trim();
      }

      if (typeof req.query.category_id === "string" && req.query.category_id.trim()) {
        filters.category_id = req.query.category_id.trim();
      }

      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : typeof req.query.q === "string"
            ? req.query.q.trim()
            : "";

      if (search) {
        filters.search = search;
      }

      const works = await workModel.getAll(filters);
      return res.status(200).json(works);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const work = await workModel.getById(req.params.id);

      if (!work) {
        return res.status(404).json({ error: "Work not found" });
      }

      return res.status(200).json(work);
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = buildWorkPayload(req.body);

      if (!payload || typeof payload.title !== "string" || payload.title.length === 0) {
        return res.status(400).json({ error: "Field 'title' is required" });
      }

      const created = await workModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const payload = buildWorkPayload(req.body);

      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({ error: "Request body cannot be empty" });
      }

      if (
        payload.title !== undefined &&
        (typeof payload.title !== "string" || payload.title.length === 0)
      ) {
        return res.status(400).json({ error: "Field 'title' must be a non-empty string" });
      }

      const updated = await workModel.update(req.params.id, payload);

      if (!updated) {
        return res.status(404).json({ error: "Work not found" });
      }

      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await workModel.remove(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Work not found" });
      }

      return res.status(200).json({
        message: "Work deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

export default workController;
