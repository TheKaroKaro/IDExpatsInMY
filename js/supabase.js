// Initialize Supabase client with a unique name
const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Services API
const ServicesAPI = {
  async getApproved(options = {}) {
    let query = supabaseClient
      .from('services')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabaseClient
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async submit(serviceData, turnstileToken) {
    const { data, error } = await supabaseClient
      .from('services')
      .insert([{
        name: serviceData.name,
        category: serviceData.category,
        phone: serviceData.phone,
        whatsapp: serviceData.whatsapp,
        area: serviceData.area,
        address: serviceData.address,
        description: serviceData.description,
        submitted_by: serviceData.submitted_by,
        status: 'pending',
        average_rating: 0,
        reviews_count: 0
      }])
      .select();
    if (error) throw error;
    return data;
  },

  async getByCategory(category) {
    const { data, error } = await supabaseClient
      .from('services')
      .select('*')
      .eq('status', 'approved')
      .eq('category', category)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

// Articles API
const ArticlesAPI = {
  async getApproved(options = {}) {
    let query = supabaseClient
      .from('articles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getFeatured() {
    const { data, error } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('status', 'approved')
      .eq('featured', true)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getBySlug(slug) {
    const { data, error } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();
    if (error) throw error;
    return data;
  },

  async submit(articleData, turnstileToken) {
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data, error } = await supabaseClient
      .from('articles')
      .insert([{
        title: articleData.title,
        content: articleData.content,
        author: articleData.author || 'Anonymous',
        category: articleData.category || 'Umum',
        image_url: articleData.imageUrl,
        slug: slug,
        featured: false,
        status: 'pending'
      }])
      .select();
    if (error) throw error;
    return data;
  }
};

// Ratings API
const RatingsAPI = {
  async submit(serviceId, stars, displayName, turnstileToken) {
    const { data, error } = await supabaseClient
      .from('ratings')
      .insert([{
        service_id: serviceId,
        stars: stars,
        display_name: displayName
      }])
      .select();
    if (error) throw error;
    return data;
  }
};

// Admin API
const AdminAPI = {
  async isAdmin(email) {
    const { data, error } = await supabaseClient
      .from('admins')
      .select('email')
      .eq('email', email)
      .single();
    return !!data;
  },

  async getPendingServices() {
    const { data, error } = await supabaseClient
      .from('services')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPendingArticles() {
    const { data, error } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateServiceStatus(id, status) {
    const { data, error } = await supabaseClient
      .from('services')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  async updateArticleStatus(id, status) {
    const { data, error } = await supabaseClient
      .from('articles')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  async setFeaturedArticle(id) {
    await supabaseClient
      .from('articles')
      .update({ featured: false })
      .neq('id', id);

    const { data, error } = await supabaseClient
      .from('articles')
      .update({ featured: true })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  }
};