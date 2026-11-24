import supabase from "../config/supabaseClient.js";

const TABLE = "authors";

export const authorModel = {
  async getAll(filters = {}) {
    let query = supabase
      .from(TABLE)
      .select("*")
      .order("name", { ascending: true });

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async getById(id) {
    const { data: author, error: authorError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (authorError) throw authorError;
    if (!author) return null;

    const { data: works, error: worksError } = await supabase
      .from("works")
      .select(`
        *,
        categories (id, name)
      `)
      .eq("author_id", id)
      .order("id", { ascending: true });

    if (worksError) throw worksError;

    return {
      ...author,
      works: works ?? [],
    };
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
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

export default authorModel;
