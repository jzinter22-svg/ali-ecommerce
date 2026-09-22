// تنسيق السعر بالدينار العراقي مع فواصل الآلاف
function formatPrice(amount) {
  return `${amount.toLocaleString("en-US")} د.ع`;
}

// إنشاء عنصر DOM واحد يمثل بطاقة منتج
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const image = document.createElement("div");
  image.className = "product-image";
  image.textContent = product.image;

  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.name;

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.category;

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = formatPrice(product.price);

  const stockInfo = document.createElement("p");
  stockInfo.className = product.stock > 0 ? "product-stock" : "product-stock out-of-stock";
  stockInfo.textContent = product.stock > 0 ? `متوفر — ${product.stock} قطع` : "نفد المخزون";

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = isFavorite(product.id) ? "btn-favorite active" : "btn-favorite";
  favoriteBtn.textContent = isFavorite(product.id) ? "♥ إزالة من المفضلة" : "♡ أضف للمفضلة";
  favoriteBtn.addEventListener("click", () => toggleFavorite(product.id));

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "btn-add-cart";
  addToCartBtn.textContent = product.stock > 0 ? "أضف إلى السلة" : "نفد المخزون";
  addToCartBtn.disabled = product.stock <= 0;
  addToCartBtn.addEventListener("click", () => addToCart(product.id));

  const viewDetailsBtn = document.createElement("button");
  viewDetailsBtn.className = "btn-view-product-details";
  viewDetailsBtn.textContent = "عرض التفاصيل";
  viewDetailsBtn.addEventListener("click", () => {
    renderProductDetails(product.id);
    const overlay = document.getElementById("product-details-overlay");
    if (overlay) overlay.hidden = false;
  });

  card.appendChild(image);
  card.appendChild(name);
  card.appendChild(category);
  card.appendChild(price);
  card.appendChild(stockInfo);
  card.appendChild(favoriteBtn);
  card.appendChild(viewDetailsBtn);
  card.appendChild(addToCartBtn);

  return card;
}

// المفضلة (Favorites): قائمة معرّفات منتجات فقط، تُقارَن دائمًا مع مصفوفة adminProducts الحيّة
let favorites = [];

const FAVORITES_STORAGE_KEY = "ali-ecommerce-favorites";

// حفظ قائمة معرّفات المفضلة في localStorage
function saveFavoritesToStorage() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    // localStorage غير متاح - يستمر التطبيق بدون حفظ المفضلة
  }
}

// استرجاع معرّفات المفضلة المحفوظة، والتحقق من صحتها مقابل مصفوفة adminProducts الحيّة
function loadFavoritesFromStorage() {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id) => adminProducts.some((product) => product.id === id));
  } catch (error) {
    return [];
  }
}

// هل هذا المنتج ضمن المفضلة الحالية؟
function isFavorite(productId) {
  return favorites.includes(productId);
}

// إضافة/إزالة منتج من المفضلة حسب حالته الحالية
function toggleFavorite(productId) {
  if (favorites.includes(productId)) {
    favorites = favorites.filter((id) => id !== productId);
  } else {
    favorites.push(productId);
  }

  saveFavoritesToStorage();
  refreshFavoritesUI();
}

// تحديث عدد المنتجات الظاهر بجانب "المفضلة"
function updateFavoritesCount() {
  const favoritesCountEl = document.getElementById("favorites-count");
  if (!favoritesCountEl) return;

  favoritesCountEl.textContent = favorites.length;
}

// عرض منتجات المفضلة الحالية (باستخدام نفس بطاقة المنتج المستخدمة في الصفحة الرئيسية)
function renderFavorites() {
  const favoritesBody = document.getElementById("favorites-body");
  if (!favoritesBody) return;

  favoritesBody.innerHTML = "";

  const favoriteProducts = adminProducts.filter(
    (product) => favorites.includes(product.id) && product.visible !== false
  );

  if (favoriteProducts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "no-results";
    emptyMessage.textContent = "لا توجد منتجات في المفضلة";
    favoritesBody.appendChild(emptyMessage);
    return;
  }

  favoriteProducts.forEach((product) => {
    favoritesBody.appendChild(createProductCard(product));
  });
}

// تحديث كل واجهات المفضلة بعد أي تغيير: العداد، نافذة المفضلة، وحالة الأزرار في الشبكة الرئيسية
function refreshFavoritesUI() {
  updateFavoritesCount();
  renderFavorites();
  applyProductFilters();
}

// عرض التفاصيل الكاملة لمنتج واحد عبر معرّفه، من مصدر الحقيقة الوحيد: مصفوفة adminProducts الحيّة
// الكمية المختارة حاليًا في نافذة تفاصيل المنتج (تخص العرض الحالي فقط)
let productDetailsQuantity = 1;

function renderProductDetails(productId) {
  const detailsBody = document.getElementById("product-details-body");
  if (!detailsBody) return;

  detailsBody.innerHTML = "";
  productDetailsQuantity = 1;

  const product = adminProducts.find((p) => p.id === productId);

  if (!product) {
    const notFoundMessage = document.createElement("p");
    notFoundMessage.className = "cart-empty";
    notFoundMessage.textContent = "تعذّر العثور على هذا المنتج";
    detailsBody.appendChild(notFoundMessage);
    return;
  }

  const image = document.createElement("div");
  image.className = "product-details-image";
  image.textContent = product.image;

  const name = document.createElement("h3");
  name.className = "product-details-name";
  name.textContent = product.name;

  const category = document.createElement("p");
  category.className = "product-details-category";
  category.textContent = product.category;

  const price = document.createElement("p");
  price.className = "product-details-price";
  price.textContent = formatPrice(product.price);

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = isFavorite(product.id) ? "btn-favorite active" : "btn-favorite";
  favoriteBtn.textContent = isFavorite(product.id) ? "♥ إزالة من المفضلة" : "♡ أضف للمفضلة";
  favoriteBtn.addEventListener("click", () => {
    toggleFavorite(product.id);
    renderProductDetails(product.id);
  });

  const qtyControls = document.createElement("div");
  qtyControls.className = "product-details-qty";

  const decreaseBtn = document.createElement("button");
  decreaseBtn.className = "btn-qty";
  decreaseBtn.textContent = "−";
  decreaseBtn.setAttribute("aria-label", "إنقاص الكمية المطلوبة");

  const qtyValue = document.createElement("span");
  qtyValue.className = "qty-value";
  qtyValue.textContent = productDetailsQuantity;

  const increaseBtn = document.createElement("button");
  increaseBtn.className = "btn-qty";
  increaseBtn.textContent = "+";
  increaseBtn.setAttribute("aria-label", "زيادة الكمية المطلوبة");

  increaseBtn.disabled = productDetailsQuantity >= product.stock;

  decreaseBtn.addEventListener("click", () => {
    if (productDetailsQuantity > 1) {
      productDetailsQuantity -= 1;
      qtyValue.textContent = productDetailsQuantity;
      increaseBtn.disabled = productDetailsQuantity >= product.stock;
    }
  });

  increaseBtn.addEventListener("click", () => {
    if (productDetailsQuantity < product.stock) {
      productDetailsQuantity += 1;
      qtyValue.textContent = productDetailsQuantity;
      increaseBtn.disabled = productDetailsQuantity >= product.stock;
    }
  });

  qtyControls.appendChild(decreaseBtn);
  qtyControls.appendChild(qtyValue);
  qtyControls.appendChild(increaseBtn);

  const stockInfo = document.createElement("p");
  stockInfo.className = product.stock > 0 ? "product-stock" : "product-stock out-of-stock";
  stockInfo.textContent = product.stock > 0 ? `متوفر — ${product.stock} قطع` : "نفد المخزون";

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "btn-add-cart";
  addToCartBtn.textContent = product.stock > 0 ? "أضف إلى السلة" : "نفد المخزون";
  addToCartBtn.disabled = product.stock <= 0;
  addToCartBtn.addEventListener("click", () => {
    for (let i = 0; i < productDetailsQuantity; i++) {
      addToCart(product.id);
    }
  });

  detailsBody.appendChild(image);
  detailsBody.appendChild(name);
  detailsBody.appendChild(category);
  detailsBody.appendChild(price);
  detailsBody.appendChild(stockInfo);
  detailsBody.appendChild(qtyControls);
  detailsBody.appendChild(favoriteBtn);
  detailsBody.appendChild(addToCartBtn);
}

// عرض قائمة المنتجات داخل الحاوية في الصفحة
function renderProducts(productList) {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "";

  if (productList.length === 0) {
    const noResults = document.createElement("p");
    noResults.className = "no-results";
    noResults.textContent = "لا توجد منتجات مطابقة";
    container.appendChild(noResults);
    return;
  }

  productList.forEach((product) => {
    container.appendChild(createProductCard(product));
  });
}

// حالة البحث والتصفية والترتيب الحالية (لا تؤثر على مصفوفة adminProducts نفسها)
let productSearchTerm = "";
let selectedProductCategory = "all";
let selectedSortOption = "default";

// ترتيب نسخة من قائمة المنتجات المُصفّاة دون التأثير على القائمة الأصلية
function sortProducts(productList, sortOption) {
  const sorted = [...productList];

  switch (sortOption) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ar"));
      break;
    default:
      break; // بلا ترتيب إضافي - كما وردت في نتيجة التصفية
  }

  return sorted;
}

// ملء قائمة الفئات بالفئات الفعلية الموجودة في adminProducts، دون تكرار (تُعاد كلما تغيّر الكتالوج)
function populateCategoryFilter() {
  const categorySelect = document.getElementById("category-filter");
  if (!categorySelect) return;

  Array.from(categorySelect.children)
    .filter((option) => option.value !== "all")
    .forEach((option) => option.remove());

  const visibleProducts = adminProducts.filter((product) => product.visible !== false);
  const categories = [...new Set(visibleProducts.map((product) => product.category))];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// تطبيق البحث بالاسم والتصفية بالفئة معًا على مصفوفة adminProducts الحيّة (مصدر المتجر الفعلي)، ثم عرض النتيجة
function applyProductFilters() {
  const term = productSearchTerm.trim().toLowerCase();

  const filtered = adminProducts.filter((product) => {
    if (product.visible === false) return false;
    const matchesSearch = product.name.toLowerCase().includes(term);
    const matchesCategory = selectedProductCategory === "all" || product.category === selectedProductCategory;
    return matchesSearch && matchesCategory;
  });

  renderProducts(sortProducts(filtered, selectedSortOption));
}

// سلة التسوق (تبدأ فارغة في الذاكرة، وتُحمَّل من localStorage عند تشغيل الصفحة)
// تبقى محلية بالكامل - لا سبب لتخزينها في الخادم لمتجر بلا حسابات زبائن
let cart = [];

const CART_STORAGE_KEY = "ali-ecommerce-cart";

// حفظ حالة السلة الحالية في localStorage
function saveCartToStorage() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    // localStorage غير متاح (وضع التصفح الخاص مثلاً) - يستمر التطبيق بدون حفظ
  }
}

// استرجاع السلة المحفوظة من localStorage وإعادة بنائها من مصدر الحقيقة الوحيد: مصفوفة adminProducts الحيّة
// (المُحمَّلة من Supabase) - لا يُعتمد على الاسم/السعر/الفئة/الصورة المخزّنة سابقًا، فقط على معرّف المنتج والكمية
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];

    const quantitiesById = new Map();

    parsed.forEach((storedItem) => {
      if (!storedItem || typeof storedItem !== "object") return;

      const product = adminProducts.find((p) => p.id === storedItem.id);
      if (!product) return; // معرّف منتج غير موجود في الكتالوج الحالي - يُتجاهل

      const quantity = Number(storedItem.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return; // كمية غير صالحة - تُتجاهل

      quantitiesById.set(product.id, (quantitiesById.get(product.id) || 0) + quantity);
    });

    return adminProducts
      .filter((product) => quantitiesById.has(product.id))
      .map((product) => ({ ...product, quantity: quantitiesById.get(product.id) }));
  } catch (error) {
    return [];
  }
}

// إضافة منتج إلى السلة عن طريق معرّفه، أو زيادة الكمية إذا كان موجودًا مسبقًا
// لا تتجاوز الكمية في السلة أبدًا المخزون المتاح فعليًا لهذا المنتج
function addToCart(productId) {
  const product = adminProducts.find((p) => p.id === productId);
  if (!product) return;

  const cartItem = cart.find((item) => item.id === productId);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  if (currentQuantity >= product.stock) return; // لا مخزون كافٍ لإضافة قطعة أخرى

  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  refreshCartUI();
}

// إزالة منتج بالكامل من السلة عن طريق معرّفه
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  refreshCartUI();
}

// إنقاص كمية منتج بمقدار واحد، وإزالته إذا وصلت الكمية إلى صفر
function decreaseQuantity(productId) {
  const cartItem = cart.find((item) => item.id === productId);
  if (!cartItem) return;

  if (cartItem.quantity <= 1) {
    removeFromCart(productId);
    return;
  }

  cartItem.quantity -= 1;
  refreshCartUI();
}

// إفراغ السلة بالكامل
function clearCart() {
  cart = [];
  refreshCartUI();
}

// تحديث عدد القطع الظاهر بجانب "سلة التسوق"
function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
}

// عرض محتويات السلة داخل لوحة السلة
function renderCart() {
  const cartItemsEl = document.getElementById("cart-items");
  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "السلة فارغة";
    cartItemsEl.appendChild(emptyMessage);
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const image = document.createElement("div");
    image.className = "cart-item-image";
    image.textContent = item.image;

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const name = document.createElement("p");
    name.className = "cart-item-name";
    name.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "cart-item-meta";
    meta.textContent = `${formatPrice(item.price)} للقطعة`;

    const qtyControls = document.createElement("div");
    qtyControls.className = "cart-item-qty";

    const decreaseBtn = document.createElement("button");
    decreaseBtn.className = "btn-qty";
    decreaseBtn.textContent = "−";
    decreaseBtn.setAttribute("aria-label", "إنقاص الكمية");
    decreaseBtn.addEventListener("click", () => decreaseQuantity(item.id));

    const qtyValue = document.createElement("span");
    qtyValue.className = "qty-value";
    qtyValue.textContent = item.quantity;

    const increaseBtn = document.createElement("button");
    increaseBtn.className = "btn-qty";
    increaseBtn.textContent = "+";
    increaseBtn.setAttribute("aria-label", "زيادة الكمية");
    increaseBtn.addEventListener("click", () => addToCart(item.id));

    qtyControls.appendChild(decreaseBtn);
    qtyControls.appendChild(qtyValue);
    qtyControls.appendChild(increaseBtn);

    const subtotal = document.createElement("p");
    subtotal.className = "cart-item-subtotal";
    subtotal.textContent = `المجموع: ${formatPrice(item.price * item.quantity)}`;

    info.appendChild(name);
    info.appendChild(meta);
    info.appendChild(qtyControls);
    info.appendChild(subtotal);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove-item";
    removeBtn.textContent = "إزالة";
    removeBtn.addEventListener("click", () => removeFromCart(item.id));

    row.appendChild(image);
    row.appendChild(info);
    row.appendChild(removeBtn);

    cartItemsEl.appendChild(row);
  });
}

// حساب وعرض إجمالي سعر السلة
function updateCartTotal() {
  const totalEl = document.getElementById("cart-total-amount");
  if (!totalEl) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalEl.textContent = total.toLocaleString("en-US");
}

// تحديث كامل واجهة السلة بعد أي تغيير عليها، وحفظ الحالة الجديدة
function refreshCartUI() {
  updateCartCount();
  renderCart();
  updateCartTotal();
  saveCartToStorage();
}

// ==========================================================================
// الكتالوج (products) — مصدره الآن Supabase حصرًا، عبر db.js
// adminProducts: نسخة عامة (منتجات ظاهرة فقط، anon) يعتمد عليها المتجر/السلة/المفضلة
// adminCatalogCache: نسخة كاملة (ظاهرة + مخفية) لا تُحمَّل إلا لجلسة أدمن مصادَق عليها
// ==========================================================================

let adminProducts = [];
let adminCatalogCache = [];
let editingAdminProductId = null;

// يفرض حدًا أقصى زمنيًا على أي وعد (promise) - مفيد ضد بطء بدء تشغيل Supabase
// الأول بعد فترة خمول (cold start)، حيث قد تتعلّق طلبات fetch بلا مهلة افتراضية
function withTimeout(promise, ms, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]);
}

// تنفّذ fn() مع مهلة زمنية لكل محاولة، وإعادة محاولة واحدة بعد تأخير قصير إذا فشلت
// المحاولة الأولى (غالبًا بسبب cold start على الخطة المجانية لـ Supabase) - تُستخدم
// في كل نقاط تحميل البيانات الأساسية (كتالوج الزبون، كتالوج الأدمن، الطلبات) لتفادي
// فشل دائم لمجرد أن أول طلب صادف بدء تشغيل بطيئًا
async function withRetryOnce(fn, timeoutMessage) {
  try {
    return await withTimeout(fn(), 8000, timeoutMessage);
  } catch (firstError) {
    console.warn("فشلت المحاولة الأولى، إعادة المحاولة بعد تأخير قصير:", firstError);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return await withTimeout(fn(), 8000, timeoutMessage + " (المحاولة الثانية)");
  }
}

// تحميل الكتالوج العام (كما يراه الزبون) من Supabase
async function reloadStorefrontCatalog() {
  adminProducts = await withRetryOnce(() => dbGetProducts(), "انتهت مهلة تحميل الكتالوج");
}

// تحميل الكتالوج الكامل (ظاهر + مخفي) لعرضه في لوحة تحكم الأدمن فقط
async function reloadAdminCatalog() {
  adminCatalogCache = await withRetryOnce(() => dbGetAllProductsAdmin(), "انتهت مهلة تحميل كتالوج الأدمن");
}

// تصنيف حالة المخزون لأغراض العرض فقط (لا يُغيّر القيمة الفعلية)
function getStockStatus(stock) {
  if (stock === 0) return { label: "نفد المخزون", className: "out" };
  if (stock <= 5) return { label: `مخزون منخفض — ${stock}`, className: "low" };
  return { label: `متوفر — ${stock}`, className: "normal" };
}

// عرض قائمة منتجات لوحة التحكم مع أزرار تعديل/حذف لكل منتج
function renderAdminProducts() {
  const listEl = document.getElementById("admin-products-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (adminCatalogCache.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "لا توجد منتجات بعد";
    listEl.appendChild(emptyMessage);
    return;
  }

  adminCatalogCache.forEach((product) => {
    const row = document.createElement("div");
    row.className = "admin-product-row";

    const info = document.createElement("div");
    info.className = "admin-product-info";
    info.textContent = `${product.image || ""} ${product.name} — ${product.category} — ${formatPrice(product.price)}`.replace(/^\s+/, "");

    const visibilityBadge = document.createElement("span");
    visibilityBadge.className = product.visible ? "admin-visibility-badge visible" : "admin-visibility-badge hidden";
    visibilityBadge.textContent = product.visible ? "ظاهر للعملاء" : "مخفي عن العملاء";

    const stockStatus = getStockStatus(product.stock);
    const stockBadge = document.createElement("span");
    stockBadge.className = `admin-stock-badge ${stockStatus.className}`;
    stockBadge.textContent = stockStatus.label;

    const actions = document.createElement("div");
    actions.className = "admin-product-actions";

    const visibilityBtn = document.createElement("button");
    visibilityBtn.type = "button";
    visibilityBtn.className = "btn-view-product-details";
    visibilityBtn.textContent = product.visible ? "إخفاء عن المتجر" : "إظهار في المتجر";
    visibilityBtn.addEventListener("click", () => toggleAdminProductVisibility(product.id));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-view-product-details";
    editBtn.textContent = "تعديل";
    editBtn.addEventListener("click", () => startEditAdminProduct(product.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-remove-item";
    deleteBtn.textContent = "حذف";
    deleteBtn.addEventListener("click", () => deleteAdminProduct(product.id));

    actions.appendChild(visibilityBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(info);
    row.appendChild(visibilityBadge);
    row.appendChild(stockBadge);
    row.appendChild(actions);
    listEl.appendChild(row);
  });
}

// تعبئة النموذج ببيانات منتج موجود للتعديل عليه
function startEditAdminProduct(productId) {
  const product = adminCatalogCache.find((p) => p.id === productId);
  if (!product) return;

  editingAdminProductId = productId;

  document.getElementById("admin-product-id").value = product.id;
  document.getElementById("admin-product-name").value = product.name;
  document.getElementById("admin-product-price").value = product.price;
  document.getElementById("admin-product-category").value = product.category;
  document.getElementById("admin-product-image").value = product.image;
  document.getElementById("admin-product-stock").value = product.stock;

  const submitBtn = document.getElementById("admin-form-submit");
  const cancelBtn = document.getElementById("admin-form-cancel");
  if (submitBtn) submitBtn.textContent = "تحديث المنتج";
  if (cancelBtn) cancelBtn.hidden = false;
}

// إلغاء وضع التعديل وإعادة النموذج إلى حالة الإضافة الافتراضية
function cancelAdminEdit() {
  editingAdminProductId = null;

  const form = document.getElementById("admin-product-form");
  if (form) form.reset();
  document.getElementById("admin-product-id").value = "";

  const submitBtn = document.getElementById("admin-form-submit");
  const cancelBtn = document.getElementById("admin-form-cancel");
  if (submitBtn) submitBtn.textContent = "إضافة المنتج";
  if (cancelBtn) cancelBtn.hidden = true;
}

// تبديل ظهور منتج للعملاء دون حذفه من الكتالوج الإداري
async function toggleAdminProductVisibility(productId) {
  const product = adminCatalogCache.find((p) => p.id === productId);
  if (!product) return;

  try {
    // آمن لإعادة المحاولة: تحديث بقيمة مطلقة (visible = X) - إعادة إرساله لا يضاعف شيئًا
    await withRetryOnce(() => dbUpdateProduct(productId, { visible: !product.visible }), "انتهت مهلة تغيير حالة الظهور");
    await reloadAdminCatalog();
    renderAdminProducts();
    await refreshStorefrontAfterAdminChange();
  } catch (error) {
    alert("تعذّر تغيير حالة الظهور: " + error.message);
  }
}

// حذف منتج من لوحة التحكم عبر معرّفه
async function deleteAdminProduct(productId) {
  try {
    // آمن لإعادة المحاولة: حذف صف بمعرّفه - إعادة الحذف بعد نجاحه فعلاً لا تؤثر على شيء (0 صفوف تُحذف في الثانية)
    await withRetryOnce(() => dbDeleteProduct(productId), "انتهت مهلة حذف المنتج");

    if (editingAdminProductId === productId) {
      cancelAdminEdit();
    }

    await reloadAdminCatalog();
    renderAdminProducts();
    await refreshStorefrontAfterAdminChange();
  } catch (error) {
    alert("تعذّر حذف المنتج: " + error.message);
  }
}

// إضافة منتج جديد أو تحديث منتج موجود بناءً على بيانات النموذج
async function saveAdminProductForm(name, price, category, image, stock) {
  const isUpdate = editingAdminProductId !== null;
  try {
    if (isUpdate) {
      // آمن لإعادة المحاولة: تحديث بقيم مطلقة (name/price/category/image/stock) - إعادة
      // إرسال نفس القيم يضبطها لنفس النتيجة النهائية دائمًا، بلا أي خطر مضاعفة
      await withRetryOnce(
        () => dbUpdateProduct(editingAdminProductId, { name, price, category, image, stock }),
        "انتهت مهلة تحديث المنتج"
      );
    } else {
      // غير آمن لإعادة المحاولة تلقائيًا: الإضافة تُنشئ صفًا جديدًا بمعرّف جديد في كل
      // مرة - لو نجحت المحاولة الأولى فعليًا على الخادم لكن ضاعت الاستجابة، فإعادة
      // المحاولة تلقائيًا قد تُنشئ منتجًا مكررًا فعليًا (بخلاف التحديث/الحذف). لذا نطبّق
      // مهلة زمنية فقط بدون إعادة محاولة صامتة، ونوجّه الأدمن للتحقق يدويًا عند الفشل
      await withTimeout(dbAddProduct({ name, price, category, image, stock, visible: true }), 8000, "انتهت مهلة إضافة المنتج");
    }

    await reloadAdminCatalog();
    renderAdminProducts();
    cancelAdminEdit();
    await refreshStorefrontAfterAdminChange();
  } catch (error) {
    if (isUpdate) {
      alert("تعذّر حفظ المنتج: " + error.message);
    } else {
      alert(
        "تعذّر تأكيد إضافة المنتج (قد تكون المحاولة نجحت فعلاً ولم يصل التأكيد): " +
          error.message +
          "\n\nتحقق من قائمة المنتجات قبل إعادة المحاولة لتفادي إضافته مرتين."
      );
    }
  }
}

// إزالة أي عنصر سلة يشير إلى منتج لم يعد موجودًا في adminProducts، وتحديث بيانات العناصر المتبقية
// (كالسعر) لتطابق الكتالوج الحالي، مع تقييد الكمية بالمخزون المتاح فعليًا (وإزالة العنصر كليًا إذا نفد المخزون)
function resyncCartWithCatalog() {
  cart = cart
    .filter((item) => adminProducts.some((product) => product.id === item.id))
    .map((item) => {
      const product = adminProducts.find((product) => product.id === item.id);
      return { ...product, quantity: Math.min(item.quantity, product.stock) };
    })
    .filter((item) => item.quantity > 0);
  refreshCartUI();
}

// إزالة أي معرّف مفضلة لم يعد يشير إلى منتج موجود في adminProducts
function resyncFavoritesWithCatalog() {
  favorites = favorites.filter((id) => adminProducts.some((product) => product.id === id));
  saveFavoritesToStorage();
  refreshFavoritesUI();
}

// إعادة مزامنة كل واجهات المتجر (الفئات، الشبكة، السلة، المفضلة) بعد أي تغيير من لوحة التحكم
async function refreshStorefrontAfterAdminChange() {
  await reloadStorefrontCatalog();
  populateCategoryFilter();
  applyProductFilters();
  resyncCartWithCatalog();
  resyncFavoritesWithCatalog();
}

// ==========================================================================
// الطلبات (Orders) — عبر RPC فقط (create_order_rpc / update_order_status_rpc /
// lookup_order_rpc / list_orders_rpc)، لا وصول مباشر لجداول orders/order_items
// ==========================================================================

// حالات الطلب المسموح بها وتسمياتها بالعربية (تطابق قيد check في قاعدة البيانات)
const ORDER_STATUS_LABELS = {
  new: "جديد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS);
const DEFAULT_ORDER_STATUS = "new";

// طريقة الدفع الوحيدة المدعومة حالياً: الدفع عند الاستلام (COD)
// بنية جاهزة للتوسع لاحقاً عند إضافة بوابات دفع حقيقية (يكفي إضافة مفتاح جديد هنا
// وفي قيد قاعدة البيانات وRPC، دون إعادة هيكلة جدول orders أو منطق الطلب)
const PAYMENT_METHOD_LABELS = {
  cod: "الدفع عند الاستلام",
};
const PAYMENT_METHOD = "cod";

// حالات الطلب التي يُسمح منها بالإلغاء فقط (new أو processing) - للعرض فقط
// (الإنفاذ الحقيقي يتم داخل update_order_status_rpc على الخادم)
const CANCELLABLE_ORDER_STATUSES = ["new", "processing"];

function isOrderCancellable(statusValue) {
  return CANCELLABLE_ORDER_STATUSES.includes(statusValue);
}

// تطويع استجابة RPC (snake_case) إلى نفس الشكل الذي تتوقعه دوال العرض في هذا الملف
function normalizeRpcOrder(o) {
  return {
    orderId: o.order_code,
    createdAt: o.created_at || new Date().toISOString(),
    customer: { name: o.customer_name, phone: o.customer_phone, address: o.customer_address },
    items: (o.items || []).map((item) => ({
      id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    itemCount: o.item_count,
    total: o.total,
    status: o.status,
    paymentMethod: o.payment_method,
  };
}

// بناء طلب من حالة السلة الحالية عبر create_order_rpc (السعر/الاسم يُشتقّان من الخادم حصرًا)
async function createOrderFromCart(customerName, customerPhone, customerAddress) {
  const items = cart.map((item) => ({ productId: item.id, quantity: item.quantity }));
  const raw = await dbCreateOrderRpc(customerName, customerPhone, customerAddress, items, PAYMENT_METHOD);
  return normalizeRpcOrder(raw);
}

// قائمة محلية مختصرة (كود الطلب + الهاتف فقط) لتسهيل إعادة البحث لاحقًا على نفس الجهاز
// ليست مصدر الحقيقة أبدًا - تُستخدم فقط كاختصار لإعادة الجلب الحي عبر lookup_order_rpc
const RECENT_ORDERS_KEY = "ali-ecommerce-recent-orders";
const MAX_RECENT_ORDERS = 10;

function saveRecentOrderShortcut(orderCode, phone) {
  try {
    const stored = localStorage.getItem(RECENT_ORDERS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    const withoutDuplicate = list.filter((entry) => entry && entry.orderCode !== orderCode);
    withoutDuplicate.unshift({ orderCode, phone, savedAt: new Date().toISOString() });
    localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(withoutDuplicate.slice(0, MAX_RECENT_ORDERS)));
  } catch (error) {
    // localStorage غير متاح - يستمر التطبيق بدون حفظ الاختصار
  }
}

function loadRecentOrderShortcuts() {
  try {
    const stored = localStorage.getItem(RECENT_ORDERS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.orderCode === "string" && typeof entry.phone === "string");
  } catch (error) {
    return [];
  }
}

// عرض نموذج البحث عن طلب (بالكود + الهاتف) مع قائمة اختصارات لآخر طلبات هذا الجهاز
function renderOrderLookup() {
  const ordersBody = document.getElementById("orders-body");
  if (!ordersBody) return;

  const panelTitle = document.getElementById("orders-panel-title");
  if (panelTitle) panelTitle.textContent = "طلباتي";

  ordersBody.innerHTML = "";

  const form = document.createElement("form");
  form.className = "checkout-form order-lookup-form";

  const codeLabel = document.createElement("label");
  codeLabel.textContent = "رقم الطلب";
  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.name = "orderCode";
  codeInput.required = true;
  codeInput.placeholder = "مثال: ORD-12";

  const phoneLabel = document.createElement("label");
  phoneLabel.textContent = "رقم الهاتف المستخدَم عند الطلب";
  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.name = "phone";
  phoneInput.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn-primary";
  submitBtn.textContent = "بحث عن الطلب";

  form.appendChild(codeLabel);
  form.appendChild(codeInput);
  form.appendChild(phoneLabel);
  form.appendChild(phoneInput);
  form.appendChild(submitBtn);

  const errorLine = document.createElement("p");
  errorLine.className = "checkout-stock-error";
  errorLine.hidden = true;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorLine.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "جارٍ البحث...";

    try {
      const raw = await dbLookupOrderRpc(codeInput.value.trim(), phoneInput.value.trim());
      if (!raw) {
        errorLine.textContent = "تعذّر العثور على طلب بهذا الرقم وهذا الهاتف معًا";
        errorLine.hidden = false;
      } else {
        saveRecentOrderShortcut(raw.order_code, phoneInput.value.trim());
        renderOrderDetails(normalizeRpcOrder(raw));
        return;
      }
    } catch (error) {
      errorLine.textContent = "حدث خطأ أثناء البحث: " + error.message;
      errorLine.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "بحث عن الطلب";
    }
  });

  ordersBody.appendChild(form);
  ordersBody.appendChild(errorLine);

  const recent = loadRecentOrderShortcuts();
  if (recent.length > 0) {
    const recentTitle = document.createElement("h3");
    recentTitle.textContent = "طلبات حديثة على هذا الجهاز";
    ordersBody.appendChild(recentTitle);

    recent.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "order-card";

      const codeEl = document.createElement("span");
      codeEl.className = "order-id";
      codeEl.textContent = entry.orderCode;

      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "btn-view-order-details";
      viewBtn.textContent = "عرض";
      viewBtn.addEventListener("click", async () => {
        try {
          const raw = await dbLookupOrderRpc(entry.orderCode, entry.phone);
          if (raw) {
            renderOrderDetails(normalizeRpcOrder(raw));
          }
        } catch (error) {
          alert("تعذّر جلب الطلب: " + error.message);
        }
      });

      row.appendChild(codeEl);
      row.appendChild(viewBtn);
      ordersBody.appendChild(row);
    });
  }
}

// عرض تفاصيل طلب واحد (كائن مُطوَّع بالفعل من normalizeRpcOrder) للزبون
function renderOrderDetails(order) {
  const ordersBody = document.getElementById("orders-body");
  if (!ordersBody) return;

  const panelTitle = document.getElementById("orders-panel-title");
  if (panelTitle) panelTitle.textContent = "تفاصيل الطلب";

  ordersBody.innerHTML = "";

  const details = document.createElement("div");
  details.className = "order-details";

  const header = document.createElement("div");
  header.className = "order-card-header";

  const orderIdEl = document.createElement("span");
  orderIdEl.className = "order-id";
  orderIdEl.textContent = order.orderId;

  const dateEl = document.createElement("span");
  dateEl.className = "order-date";
  dateEl.textContent = new Date(order.createdAt).toLocaleString("en-US");

  header.appendChild(orderIdEl);
  header.appendChild(dateEl);

  const statusLine = document.createElement("p");
  statusLine.className = "order-status";
  statusLine.textContent = `الحالة: ${ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS[DEFAULT_ORDER_STATUS]}`;

  const customerLine = document.createElement("p");
  customerLine.className = "order-customer";
  customerLine.textContent = `${order.customer.name} — ${order.customer.phone} — ${order.customer.address}`;

  const itemsList = document.createElement("div");
  itemsList.className = "order-items";
  order.items.forEach((item) => {
    const itemLine = document.createElement("p");
    itemLine.className = "order-item-line";
    itemLine.textContent = `${item.name} × ${item.quantity} = ${formatPrice(item.subtotal)}`;
    itemsList.appendChild(itemLine);
  });

  const totalsLine = document.createElement("p");
  totalsLine.className = "order-total";
  totalsLine.textContent = `عدد القطع: ${order.itemCount} — الإجمالي: ${formatPrice(order.total)}`;

  const paymentMethodLine = document.createElement("p");
  paymentMethodLine.className = "order-customer order-payment-method";
  paymentMethodLine.textContent = `طريقة الدفع: ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}`;

  details.appendChild(header);
  details.appendChild(statusLine);
  details.appendChild(customerLine);
  details.appendChild(itemsList);
  details.appendChild(totalsLine);
  details.appendChild(paymentMethodLine);

  ordersBody.appendChild(details);

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn-back-to-orders";
  backBtn.textContent = "→ العودة إلى طلباتي";
  backBtn.addEventListener("click", renderOrderLookup);

  ordersBody.appendChild(backBtn);
}

// ==========================================================================
// إدارة الطلبات (Admin) — عبر list_orders_rpc / update_order_status_rpc فقط
// ==========================================================================

let adminOrdersCache = [];

// تحديث عدد الطلبات الظاهر بجانب "إدارة الطلبات" في لوحة التحكم
function updateAdminOrdersCount(count) {
  const countEl = document.getElementById("admin-orders-count");
  if (countEl) countEl.textContent = count;
}

// تحميل كل الطلبات من الخادم (إدارة فقط) وتطويعها لنفس الشكل المستخدَم في العرض
async function reloadAdminOrders() {
  const raw = await withRetryOnce(() => dbListOrdersRpc(), "انتهت مهلة تحميل الطلبات");
  adminOrdersCache = raw.map(normalizeRpcOrder);
  updateAdminOrdersCount(adminOrdersCache.length);
}

// تغيير حالة طلب عبر RPC (إدارة فقط)، ثم إعادة تحميل القائمة كاملة لضمان اتساقها
async function changeOrderStatusAdmin(orderCode, newStatus) {
  await dbUpdateOrderStatusRpc(orderCode, newStatus);
  await reloadAdminOrders();
}

// عرض قائمة كل طلبات العملاء لغرض الإدارة (قراءة فقط)
function renderAdminOrderList() {
  const listEl = document.getElementById("admin-orders-list");
  if (!listEl) return;

  const titleEl = document.getElementById("admin-orders-panel-title");
  if (titleEl) titleEl.textContent = "الطلبات";

  listEl.innerHTML = "";

  updateAdminOrdersCount(adminOrdersCache.length);

  if (adminOrdersCache.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "لا توجد طلبات حتى الآن";
    listEl.appendChild(emptyMessage);
    return;
  }

  adminOrdersCache.forEach((order) => {
    const card = document.createElement("div");
    card.className = "order-card";

    const header = document.createElement("div");
    header.className = "order-card-header";

    const orderIdEl = document.createElement("span");
    orderIdEl.className = "order-id";
    orderIdEl.textContent = order.orderId;

    const dateEl = document.createElement("span");
    dateEl.className = "order-date";
    dateEl.textContent = new Date(order.createdAt).toLocaleString("en-US");

    header.appendChild(orderIdEl);
    header.appendChild(dateEl);

    const customerLine = document.createElement("p");
    customerLine.className = "order-customer";
    customerLine.textContent = order.customer.name;

    const statusLine = document.createElement("p");
    statusLine.className = "order-status";
    statusLine.textContent = `الحالة: ${ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS[DEFAULT_ORDER_STATUS]}`;

    const totalsLine = document.createElement("p");
    totalsLine.className = "order-total";
    totalsLine.textContent = `الإجمالي: ${formatPrice(order.total)}`;

    const viewDetailsBtn = document.createElement("button");
    viewDetailsBtn.type = "button";
    viewDetailsBtn.className = "btn-view-order-details";
    viewDetailsBtn.textContent = "عرض التفاصيل";
    viewDetailsBtn.addEventListener("click", () => renderAdminOrderDetails(order.orderId));

    card.appendChild(header);
    card.appendChild(customerLine);
    card.appendChild(statusLine);
    card.appendChild(totalsLine);
    card.appendChild(viewDetailsBtn);

    listEl.appendChild(card);
  });
}

// عرض تفاصيل طلب واحد لغرض الإدارة، بالاعتماد حصرًا على adminOrdersCache (لقطة من الخادم)
function renderAdminOrderDetails(orderId) {
  const listEl = document.getElementById("admin-orders-list");
  if (!listEl) return;

  const titleEl = document.getElementById("admin-orders-panel-title");
  if (titleEl) titleEl.textContent = "تفاصيل الطلب";

  listEl.innerHTML = "";

  const order = adminOrdersCache.find((o) => o.orderId === orderId);

  if (!order) {
    const notFoundMessage = document.createElement("p");
    notFoundMessage.className = "cart-empty";
    notFoundMessage.textContent = "الطلب غير موجود";
    listEl.appendChild(notFoundMessage);
  } else {
    const details = document.createElement("div");
    details.className = "order-details";

    const header = document.createElement("div");
    header.className = "order-card-header";

    const orderIdEl = document.createElement("span");
    orderIdEl.className = "order-id";
    orderIdEl.textContent = order.orderId;

    const dateEl = document.createElement("span");
    dateEl.className = "order-date";
    dateEl.textContent = new Date(order.createdAt).toLocaleString("en-US");

    header.appendChild(orderIdEl);
    header.appendChild(dateEl);

    const statusRow = document.createElement("div");
    statusRow.className = "order-status-row";

    const statusLabel = document.createElement("span");
    statusLabel.className = "order-status";
    statusLabel.textContent = `الحالة الحالية: ${ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS[DEFAULT_ORDER_STATUS]}`;

    statusRow.appendChild(statusLabel);

    if (order.status !== "cancelled") {
      const statusSelect = document.createElement("select");
      statusSelect.className = "admin-order-status-select";
      ORDER_STATUSES.filter((statusKey) => statusKey !== "cancelled").forEach((statusKey) => {
        const option = document.createElement("option");
        option.value = statusKey;
        option.textContent = ORDER_STATUS_LABELS[statusKey];
        if (statusKey === order.status) option.selected = true;
        statusSelect.appendChild(option);
      });
      statusSelect.addEventListener("change", async (event) => {
        try {
          await changeOrderStatusAdmin(order.orderId, event.target.value);
          renderAdminOrderDetails(order.orderId);
        } catch (error) {
          alert("تعذّر تحديث حالة الطلب: " + error.message);
        }
      });
      statusRow.appendChild(statusSelect);

      if (isOrderCancellable(order.status)) {
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "btn-remove-item";
        cancelBtn.textContent = "إلغاء الطلب";
        cancelBtn.addEventListener("click", async () => {
          try {
            await changeOrderStatusAdmin(order.orderId, "cancelled");
            renderAdminOrderDetails(order.orderId);
          } catch (error) {
            alert("تعذّر إلغاء الطلب: " + error.message);
          }
        });
        statusRow.appendChild(cancelBtn);
      }
    }

    const customerLine = document.createElement("p");
    customerLine.className = "order-customer";
    customerLine.textContent = `${order.customer.name} — ${order.customer.phone} — ${order.customer.address}`;

    const itemsList = document.createElement("div");
    itemsList.className = "order-items";
    order.items.forEach((item) => {
      const itemLine = document.createElement("p");
      itemLine.className = "order-item-line";
      itemLine.textContent = `${item.name} — ${formatPrice(item.price)} × ${item.quantity} = ${formatPrice(item.subtotal)}`;
      itemsList.appendChild(itemLine);
    });

    const totalsLine = document.createElement("p");
    totalsLine.className = "order-total";
    totalsLine.textContent = `عدد القطع: ${order.itemCount} — الإجمالي: ${formatPrice(order.total)}`;

    const paymentMethodLine = document.createElement("p");
    paymentMethodLine.className = "order-customer order-payment-method";
    paymentMethodLine.textContent = `طريقة الدفع: ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}`;

    details.appendChild(header);
    details.appendChild(statusRow);
    details.appendChild(customerLine);
    details.appendChild(itemsList);
    details.appendChild(totalsLine);
    details.appendChild(paymentMethodLine);

    listEl.appendChild(details);
  }

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn-back-to-orders";
  backBtn.textContent = "→ العودة إلى الطلبات";
  backBtn.addEventListener("click", renderAdminOrderList);

  listEl.appendChild(backBtn);
}

// عرض مراجعة الطلب (بنود السلة الحالية + نموذج بيانات العميل) داخل نافذة الطلب
function renderCheckoutForm() {
  const checkoutBody = document.getElementById("checkout-body");
  if (!checkoutBody) return;

  checkoutBody.innerHTML = "";

  if (cart.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "السلة فارغة. أضف منتجات قبل إتمام الطلب.";
    checkoutBody.appendChild(emptyMessage);
    return;
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const summary = document.createElement("div");
  summary.className = "checkout-summary";

  const summaryTitle = document.createElement("h3");
  summaryTitle.textContent = "ملخص الطلب";
  summary.appendChild(summaryTitle);

  cart.forEach((item) => {
    const line = document.createElement("p");
    line.className = "checkout-summary-line";
    line.textContent = `${item.name} × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`;
    summary.appendChild(line);
  });

  const countLine = document.createElement("p");
  countLine.className = "checkout-summary-total";
  countLine.textContent = `عدد القطع: ${itemCount}`;
  summary.appendChild(countLine);

  const totalLine = document.createElement("p");
  totalLine.className = "checkout-summary-total";
  totalLine.textContent = `المجموع الفرعي: ${formatPrice(total)}`;
  summary.appendChild(totalLine);

  const paymentMethodLine = document.createElement("p");
  paymentMethodLine.className = "checkout-summary-total order-payment-method";
  paymentMethodLine.textContent = `طريقة الدفع: ${PAYMENT_METHOD_LABELS[PAYMENT_METHOD]}`;
  summary.appendChild(paymentMethodLine);

  const form = document.createElement("form");
  form.className = "checkout-form";
  form.id = "checkout-form";

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "الاسم الكامل";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.name = "customerName";
  nameInput.required = true;

  const phoneLabel = document.createElement("label");
  phoneLabel.textContent = "رقم الهاتف";
  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.name = "customerPhone";
  phoneInput.required = true;

  const addressLabel = document.createElement("label");
  addressLabel.textContent = "عنوان التوصيل";
  const addressInput = document.createElement("textarea");
  addressInput.name = "customerAddress";
  addressInput.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn-primary";
  submitBtn.textContent = "تأكيد الطلب";

  form.appendChild(nameLabel);
  form.appendChild(nameInput);
  form.appendChild(phoneLabel);
  form.appendChild(phoneInput);
  form.appendChild(addressLabel);
  form.appendChild(addressInput);
  form.appendChild(submitBtn);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "جارٍ إرسال الطلب...";

    try {
      // create_order_rpc يتحقق من المخزون ويخصمه ذرّيًا على الخادم - لا حاجة لفحص مسبق هنا
      const order = await createOrderFromCart(nameInput.value, phoneInput.value, addressInput.value);
      saveRecentOrderShortcut(order.orderId, phoneInput.value.trim());
      renderCheckoutSuccess(order);
    } catch (error) {
      // على الأغلب نفاد مخزون تغيّر بعد فتح النافذة - نحدّث الكتالوج والسلة ونعيد المحاولة
      await reloadStorefrontCatalog();
      populateCategoryFilter();
      applyProductFilters();
      resyncCartWithCatalog();
      renderCheckoutForm();

      const errorMessage = document.createElement("p");
      errorMessage.className = "checkout-stock-error";
      errorMessage.textContent =
        "تعذّر إتمام الطلب (على الأغلب تغيّرت الكمية المتوفرة). تم تحديث السلة تلقائيًا، الرجاء مراجعتها والمحاولة مجددًا. تفاصيل: " +
        error.message;
      checkoutBody.insertBefore(errorMessage, checkoutBody.firstChild);
    }
  });

  checkoutBody.appendChild(summary);
  checkoutBody.appendChild(form);
}

// عرض رسالة نجاح الطلب بعد إرسال النموذج، بالاعتماد على سجل الطلب المُعاد من الخادم (وليس السلة)
function renderCheckoutSuccess(order) {
  const checkoutBody = document.getElementById("checkout-body");
  if (!checkoutBody) return;

  checkoutBody.innerHTML = "";

  const successBox = document.createElement("div");
  successBox.className = "checkout-success";

  const successTitle = document.createElement("h3");
  successTitle.textContent = "✅ تم استلام طلبك بنجاح";
  successBox.appendChild(successTitle);

  const orderIdLine = document.createElement("p");
  orderIdLine.className = "checkout-order-id";
  orderIdLine.textContent = `رقم الطلب: ${order.orderId}`;
  successBox.appendChild(orderIdLine);

  const successMessage = document.createElement("p");
  successMessage.textContent = `شكرًا ${order.customer.name}، سنتواصل معك على ${order.customer.phone} لتأكيد التوصيل إلى: ${order.customer.address}.`;
  successBox.appendChild(successMessage);

  const recap = document.createElement("p");
  recap.className = "checkout-summary-total";
  recap.textContent = `عدد القطع: ${order.itemCount} — الإجمالي: ${formatPrice(order.total)}`;
  successBox.appendChild(recap);

  const paymentMethodLine = document.createElement("p");
  paymentMethodLine.className = "checkout-summary-total order-payment-method";
  paymentMethodLine.textContent = `طريقة الدفع: ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}`;
  successBox.appendChild(paymentMethodLine);

  const keepCodeNote = document.createElement("p");
  keepCodeNote.className = "checkout-summary-total";
  keepCodeNote.textContent = "احتفظ برقم الطلب ورقم هاتفك لمتابعة حالته لاحقًا من قائمة \"طلباتي\".";
  successBox.appendChild(keepCodeNote);

  const continueBtn = document.createElement("button");
  continueBtn.type = "button";
  continueBtn.className = "btn-primary";
  continueBtn.textContent = "متابعة التسوق";
  continueBtn.addEventListener("click", () => {
    clearCart();
    const checkoutOverlay = document.getElementById("checkout-overlay");
    if (checkoutOverlay) checkoutOverlay.hidden = true;
  });
  successBox.appendChild(continueBtn);

  checkoutBody.appendChild(successBox);
}

// ==========================================================================
// مصادقة الأدمن — حساب واحد أو أكثر تُدار يدويًا عبر Supabase Auth، منفصلة تمامًا
// عن الزبائن (بلا حسابات زبائن إطلاقًا في هذا المتجر)
// ==========================================================================

async function isAdminLoggedIn() {
  const session = await dbGetSession();
  return !!session;
}

document.addEventListener("DOMContentLoaded", async () => {
  const productsContainer = document.getElementById("products-container");

  if (productsContainer) {
    productsContainer.innerHTML = "";
    const loadingMessage = document.createElement("p");
    loadingMessage.className = "no-results";
    loadingMessage.textContent = "جارٍ تحميل المنتجات...";
    productsContainer.appendChild(loadingMessage);
  }

  try {
    await reloadStorefrontCatalog();
  } catch (error) {
    if (productsContainer) {
      productsContainer.innerHTML = "";
      const errorMessage = document.createElement("p");
      errorMessage.className = "no-results";
      errorMessage.textContent = "تعذّر الاتصال بقاعدة البيانات. حاول إعادة تحميل الصفحة لاحقًا.";
      productsContainer.appendChild(errorMessage);
    }
    console.error("فشل تحميل الكتالوج من Supabase:", error);
    return;
  }

  favorites = loadFavoritesFromStorage();
  populateCategoryFilter();
  applyProductFilters();
  updateFavoritesCount();
  cart = loadCartFromStorage();
  refreshCartUI();

  const productSearchInput = document.getElementById("product-search");
  const categoryFilterSelect = document.getElementById("category-filter");
  const sortProductsSelect = document.getElementById("sort-products");
  const resetFiltersBtn = document.getElementById("reset-filters");

  if (productSearchInput) {
    productSearchInput.addEventListener("input", (event) => {
      productSearchTerm = event.target.value;
      applyProductFilters();
    });
  }

  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener("change", (event) => {
      selectedProductCategory = event.target.value;
      applyProductFilters();
    });
  }

  if (sortProductsSelect) {
    sortProductsSelect.addEventListener("change", (event) => {
      selectedSortOption = event.target.value;
      applyProductFilters();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      productSearchTerm = "";
      selectedProductCategory = "all";
      selectedSortOption = "default";
      if (productSearchInput) productSearchInput.value = "";
      if (categoryFilterSelect) categoryFilterSelect.value = "all";
      if (sortProductsSelect) sortProductsSelect.value = "default";
      applyProductFilters();
    });
  }

  const cartToggle = document.getElementById("cart-toggle");
  const cartOverlay = document.getElementById("cart-overlay");
  const closeCartBtn = document.getElementById("close-cart");
  const clearCartBtn = document.getElementById("clear-cart");
  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutOverlay = document.getElementById("checkout-overlay");
  const closeCheckoutBtn = document.getElementById("close-checkout");
  const productDetailsOverlay = document.getElementById("product-details-overlay");
  const closeProductDetailsBtn = document.getElementById("close-product-details");
  const favoritesToggle = document.getElementById("favorites-toggle");
  const favoritesOverlay = document.getElementById("favorites-overlay");
  const closeFavoritesBtn = document.getElementById("close-favorites");
  const ordersToggle = document.getElementById("orders-toggle");
  const ordersOverlay = document.getElementById("orders-overlay");
  const closeOrdersBtn = document.getElementById("close-orders");

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", clearCart);
  }

  if (cartToggle && cartOverlay && closeCartBtn) {
    cartToggle.addEventListener("click", (event) => {
      event.preventDefault();
      cartOverlay.hidden = false;
    });

    closeCartBtn.addEventListener("click", () => {
      cartOverlay.hidden = true;
    });

    cartOverlay.addEventListener("click", (event) => {
      if (event.target === cartOverlay) {
        cartOverlay.hidden = true;
      }
    });
  }

  if (checkoutBtn && checkoutOverlay && closeCheckoutBtn && cartOverlay) {
    checkoutBtn.addEventListener("click", () => {
      cartOverlay.hidden = true;
      renderCheckoutForm();
      checkoutOverlay.hidden = false;
    });

    closeCheckoutBtn.addEventListener("click", () => {
      checkoutOverlay.hidden = true;
    });

    checkoutOverlay.addEventListener("click", (event) => {
      if (event.target === checkoutOverlay) {
        checkoutOverlay.hidden = true;
      }
    });
  }

  if (ordersToggle && ordersOverlay && closeOrdersBtn) {
    ordersToggle.addEventListener("click", (event) => {
      event.preventDefault();
      renderOrderLookup();
      ordersOverlay.hidden = false;
    });

    closeOrdersBtn.addEventListener("click", () => {
      ordersOverlay.hidden = true;
    });

    ordersOverlay.addEventListener("click", (event) => {
      if (event.target === ordersOverlay) {
        ordersOverlay.hidden = true;
      }
    });
  }

  if (productDetailsOverlay && closeProductDetailsBtn) {
    closeProductDetailsBtn.addEventListener("click", () => {
      productDetailsOverlay.hidden = true;
    });

    productDetailsOverlay.addEventListener("click", (event) => {
      if (event.target === productDetailsOverlay) {
        productDetailsOverlay.hidden = true;
      }
    });
  }

  if (favoritesToggle && favoritesOverlay && closeFavoritesBtn) {
    favoritesToggle.addEventListener("click", (event) => {
      event.preventDefault();
      renderFavorites();
      favoritesOverlay.hidden = false;
    });

    closeFavoritesBtn.addEventListener("click", () => {
      favoritesOverlay.hidden = true;
    });

    favoritesOverlay.addEventListener("click", (event) => {
      if (event.target === favoritesOverlay) {
        favoritesOverlay.hidden = true;
      }
    });
  }

  // ========================================================================
  // لوحة تحكم الأدمن: بوابة تسجيل الدخول + التبويبات + نموذج المنتج
  // ========================================================================

  const adminDashboardLink = document.getElementById("admin-dashboard-link");
  const backToStoreLink = document.getElementById("back-to-store");
  const adminDashboardSection = document.getElementById("admin-dashboard");
  const mainContent = document.getElementById("main-content");
  const adminProductForm = document.getElementById("admin-product-form");
  const adminFormCancelBtn = document.getElementById("admin-form-cancel");
  const adminTabProducts = document.getElementById("admin-tab-products");
  const adminTabOrders = document.getElementById("admin-tab-orders");
  const adminProductsPanel = document.getElementById("admin-products-panel");
  const adminOrdersPanel = document.getElementById("admin-orders-panel");
  const adminLoginPanel = document.getElementById("admin-login-panel");
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminLoginError = document.getElementById("admin-login-error");
  const adminAuthenticatedArea = document.getElementById("admin-authenticated-area");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  const adminLoggedInAs = document.getElementById("admin-logged-in-as");

  async function enterAuthenticatedAdminView(session) {
    if (adminLoginPanel) adminLoginPanel.hidden = true;
    if (adminAuthenticatedArea) adminAuthenticatedArea.hidden = false;
    if (adminLoggedInAs && session && session.user) adminLoggedInAs.textContent = session.user.email;

    await reloadAdminCatalog();
    renderAdminProducts();

    if (adminTabProducts && adminTabOrders && adminProductsPanel && adminOrdersPanel) {
      adminTabProducts.classList.add("active");
      adminTabOrders.classList.remove("active");
      adminProductsPanel.hidden = false;
      adminOrdersPanel.hidden = true;
    }
  }

  function showAdminLoginView() {
    if (adminAuthenticatedArea) adminAuthenticatedArea.hidden = true;
    if (adminLoginPanel) adminLoginPanel.hidden = false;
  }

  if (adminDashboardLink && adminDashboardSection && mainContent) {
    adminDashboardLink.addEventListener("click", async (event) => {
      event.preventDefault();
      mainContent.hidden = true;
      adminDashboardSection.hidden = false;

      const session = await dbGetSession();
      if (session) {
        await enterAuthenticatedAdminView(session);
      } else {
        showAdminLoginView();
      }
    });
  }

  if (adminLoginForm && adminLoginError) {
    adminLoginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      adminLoginError.hidden = true;

      const email = document.getElementById("admin-login-email").value.trim();
      const password = document.getElementById("admin-login-password").value;

      try {
        const session = await dbAdminSignIn(email, password);
        adminLoginForm.reset();
        await enterAuthenticatedAdminView(session);
      } catch (error) {
        adminLoginError.textContent = "تعذّر تسجيل الدخول: " + error.message;
        adminLoginError.hidden = false;
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async () => {
      try {
        await dbAdminSignOut();
      } catch (error) {
        // نستمر ونعرض شاشة الدخول حتى لو فشل استدعاء signOut نفسه
      }
      showAdminLoginView();
    });
  }

  if (adminTabProducts && adminTabOrders && adminProductsPanel && adminOrdersPanel) {
    adminTabProducts.addEventListener("click", (event) => {
      event.preventDefault();
      adminTabProducts.classList.add("active");
      adminTabOrders.classList.remove("active");
      adminProductsPanel.hidden = false;
      adminOrdersPanel.hidden = true;
    });

    adminTabOrders.addEventListener("click", async (event) => {
      event.preventDefault();
      adminTabOrders.classList.add("active");
      adminTabProducts.classList.remove("active");
      adminProductsPanel.hidden = true;
      adminOrdersPanel.hidden = false;
      try {
        await reloadAdminOrders();
        renderAdminOrderList();
      } catch (error) {
        adminOrdersPanel.innerHTML = "";
        const errorMessage = document.createElement("p");
        errorMessage.className = "cart-empty";
        errorMessage.textContent = "تعذّر تحميل الطلبات: " + error.message;
        adminOrdersPanel.appendChild(errorMessage);
      }
    });
  }

  if (backToStoreLink && adminDashboardSection && mainContent) {
    backToStoreLink.addEventListener("click", (event) => {
      event.preventDefault();
      adminDashboardSection.hidden = true;
      mainContent.hidden = false;
    });
  }

  if (adminProductForm) {
    adminProductForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.getElementById("admin-product-name").value.trim();
      const price = Number(document.getElementById("admin-product-price").value);
      const category = document.getElementById("admin-product-category").value.trim();
      const image = document.getElementById("admin-product-image").value.trim();
      const stock = Number(document.getElementById("admin-product-stock").value);

      if (!name || !category || !Number.isFinite(price) || price <= 0) {
        return;
      }

      if (!Number.isInteger(stock) || stock < 0) {
        return;
      }

      await saveAdminProductForm(name, price, category, image, stock);
    });
  }

  if (adminFormCancelBtn) {
    adminFormCancelBtn.addEventListener("click", cancelAdminEdit);
  }

  // إبقاء واجهة الأدمن متزامنة مع حالة الجلسة الفعلية (مثال: انتهاء صلاحية الجلسة)
  dbOnAuthStateChange((session) => {
    if (!session && adminAuthenticatedArea && !adminAuthenticatedArea.hidden) {
      showAdminLoginView();
    }
  });
});
