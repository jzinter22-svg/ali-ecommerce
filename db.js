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
// المصادقة (تسجيل دخول الأدمن بالبريد/كلمة المرور)
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
// حسابات العملاء (Customer phone OTP auth) — منفصلة تماماً عن مصادقة الأدمن.
// تستخدم نفس عميل Supabase Auth (خانة جلسة واحدة فقط في المتصفح)، لكن
// صلاحية الأدمن الفعلية تبقى محصورة بعضوية admin_users (مُتحقَّق منها مباشرة
// من القاعدة الحيّة) — حساب عميل جديد لا يملك أي صلاحية أدمن تلقائياً.
// ============================================================

// إرسال رمز التحقق (OTP) لرقم هاتف - يتطلب تفعيل مزوّد SMS في Supabase؛
// سيفشل هذا الاستدعاء حتى يُهيَّأ مزوّد حقيقي (Twilio أو أرقام اختبار)
async function dbCustomerSendOtp(phone) {
  const { error } = await supabaseClient.auth.signInWithOtp({ phone });
  if (error) throw error;
}

// التحقق من الرمز المُدخَل وإنشاء الجلسة الفعلية عند التطابق
async function dbCustomerVerifyOtp(phone, token) {
  const { data, error } = await supabaseClient.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
  return data.session;
}

async function dbCustomerSignOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

// هل صاحب الجلسة الحالية عضو في admin_users؟ (قراءة صفه الخاص فقط - مسموحة
// عبر سياسة "admin can read own membership row" الموجودة أصلاً على الجدول)
async function dbIsCurrentUserAdmin() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const userId = sessionData && sessionData.session && sessionData.session.user && sessionData.session.user.id;
  if (!userId) return false;
  const { data, error } = await supabaseClient.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) return false;
  return !!data;
}

// ============================================================
// الطلبات (orders + order_items) — عبر RPC فقط، لا وصول مباشر للجداول
// ============================================================

// items: [{ productId, quantity }] فقط — السعر والاسم يُشتقّان من الخادم حصراً
async function dbCreateOrderRpc(customerName, customerPhone, customerAddress, items, paymentMethod) {
  const { data, error } = await supabaseClient.rpc("create_order_rpc", {
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    payment_method: paymentMethod,
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

// تُستدعى مرة واحدة فور أول تسجيل دخول ناجح لحساب جديد - تربط أي طلبات
// ضيف سابقة بنفس رقم الهاتف (لم تُربَط بعد) بهذا الحساب، وتُعيد عددها
async function dbClaimGuestOrdersRpc() {
  const { data, error } = await supabaseClient.rpc("claim_guest_orders_rpc");
  if (error) throw error;
  return data; // عدد الطلبات المرتبطة فعلياً
}

// عميل موثَّق فقط — طلباته الخاصة (user_id = auth.uid()) مع عناصرها
async function dbListMyOrdersRpc() {
  const { data, error } = await supabaseClient.rpc("list_my_orders_rpc");
  if (error) throw error;
  return data;
}
