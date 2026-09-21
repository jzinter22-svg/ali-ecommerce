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
// الطلبات (orders + order_items)
// ============================================================

async function dbGetOrders() {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function dbGetOrderItems(orderId) {
  const { data, error } = await supabaseClient
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw error;
  return data;
}

// items: [{ productId, name, price, quantity, subtotal }]
// productId يمكن أن يكون null إن لم يعد المنتج موجوداً في الكتالوج الحي
async function dbCreateOrder(orderData, items) {
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      order_code: orderData.orderCode,
      status: orderData.status || "new",
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      customer_address: orderData.customerAddress,
      item_count: orderData.itemCount,
      total: orderData.total,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const itemsToInsert = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId ?? null,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

  const { data: insertedItems, error: itemsError } = await supabaseClient
    .from("order_items")
    .insert(itemsToInsert)
    .select();
  if (itemsError) throw itemsError;

  return { ...order, order_items: insertedItems };
}

async function dbUpdateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabaseClient
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteOrder(orderId) {
  const { error } = await supabaseClient.from("orders").delete().eq("id", orderId);
  if (error) throw error;
  return true;
}
