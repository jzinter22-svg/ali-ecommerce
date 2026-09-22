// db.js
// طبقة اتصال منفصلة بقاعدة بيانات Supabase.
// ملف مستقل تماماً عن app.js — لا يتم استدعاؤه أو تحميله من index.html حالياً.
// الهدف: توفير دوال قراءة/كتابة جاهزة للاختبار المستقل فقط في هذه المرحلة.
//
// يتطلب تحميل الملفات التالية بهذا الترتيب قبل db.js في أي صفحة تستخدمه:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="config.js"></script>   (انسخه من config.example.js واملأ قيمك الحقيقية — غير مرفوع لـ GitHub)
// <script src="db.js"></script>

if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey) {
  throw new Error(
    "SUPABASE_CONFIG غير موجود. انسخ config.example.js إلى config.js، املأ url و anonKey، وحمّله قبل db.js."
  );
}

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);

// ============================================================
// المنتجات (products)
// ============================================================

async function dbGetProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

async function dbAddProduct(product) {
  const { data, error } = await supabaseClient
    .from("products")
    .insert({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      stock: product.stock,
      visible: product.visible !== undefined ? product.visible : true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbUpdateProduct(productId, updates) {
  const { data, error } = await supabaseClient
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteProduct(productId) {
  const { error } = await supabaseClient.from("products").delete().eq("id", productId);
  if (error) throw error;
  return true;
}

// ============================================================
// المصادقة (Admin auth only — لا حسابات للزبائن)
// ============================================================

async function dbAdminSignIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function dbAdminSignOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function dbGetSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
}

function dbOnAuthStateChange(callback) {
  const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

// ============================================================
// المنتجات (إدارة كاملة — تتطلب جلسة أدمن مصادَق عليها بفضل RLS)
// ============================================================

// قراءة كل المنتجات (ظاهرة ومخفية) — تعمل فقط لجلسة أدمن مسجّلة دخولها
async function dbGetAllProductsAdmin() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

// ============================================================
// الطلبات (orders + order_items) — عبر RPC فقط، لا وصول مباشر للجداول
// ============================================================

// items: [{ productId, quantity }] فقط — السعر والاسم يُشتقّان من الخادم حصراً
async function dbCreateOrderRpc(customerName, customerPhone, customerAddress, items) {
  const { data, error } = await supabaseClient.rpc("create_order_rpc", {
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  });
  if (error) throw error;
  return data;
}

// إدارة فقط — يفرض قواعد الإلغاء واستعادة المخزون ذرّيًا داخل قاعدة البيانات
async function dbUpdateOrderStatusRpc(orderCode, newStatus) {
  const { data, error } = await supabaseClient.rpc("update_order_status_rpc", {
    p_order_code: orderCode,
    p_new_status: newStatus,
  });
  if (error) throw error;
  return data;
}

// بحث الضيف عن طلبه بكود الطلب + رقم الهاتف فقط (بدون حساب)
async function dbLookupOrderRpc(orderCode, phone) {
  const { data, error } = await supabaseClient.rpc("lookup_order_rpc", {
    p_order_code: orderCode,
    p_phone: phone,
  });
  if (error) throw error;
  return data; // null إذا لم يُعثر على تطابق
}

// إدارة فقط — كل الطلبات مع عناصرها
async function dbListOrdersRpc() {
  const { data, error } = await supabaseClient.rpc("list_orders_rpc");
  if (error) throw error;
  return data;
}
