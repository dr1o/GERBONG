import supabase from "../config/supabaseClient.js";

const TABLE = "works";
const WORK_SELECT = `
  *,
  authors (id, name, lifespan),
  categories (id, name)
`;

export const workModel = {
  async getAll(filters = {}) {
    let query = supabase
      .from(TABLE)
      .select(WORK_SELECT)
      .order("id", { ascending: true });

    if (filters.author_id) {
      query = query.eq("author_id", filters.author_id);
    }

    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(WORK_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select(WORK_SELECT)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select(WORK_SELECT)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

export default workModel;
