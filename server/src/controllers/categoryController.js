import categoryModel from "../models/categoryModel.js";

const IGNORED_FIELDS = new Set(["id", "created_at", "updated_at"]);

function buildCategoryPayload(body) {
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

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await categoryModel.getAll();
      return res.status(200).json(categories);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await categoryModel.getById(req.params.id);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json(category);
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = buildCategoryPayload(req.body);

      if (!payload || typeof payload.name !== "string" || payload.name.length === 0) {
        return res.status(400).json({ error: "Field 'name' is required" });
      }

      const created = await categoryModel.create(payload);
      return res.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const payload = buildCategoryPayload(req.body);

      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({ error: "Request body cannot be empty" });
      }

      if (
        payload.name !== undefined &&
        (typeof payload.name !== "string" || payload.name.length === 0)
      ) {
        return res.status(400).json({ error: "Field 'name' must be a non-empty string" });
      }

      const updated = await categoryModel.update(req.params.id, payload);

      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await categoryModel.remove(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json({
        message: "Category deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

export default categoryController;
