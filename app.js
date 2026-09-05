// بيانات المنتجات (مصدر بيانات وهمي في الذاكرة، لا يوجد اتصال بخادم أو قاعدة بيانات)
const products = [
  { id: 1, name: "سماعات لاسلكية", price: 55000, category: "إلكترونيات", image: "🎧" },
  { id: 2, name: "ساعة ذكية", price: 120000, category: "إلكترونيات", image: "⌚" },
  { id: 3, name: "حقيبة ظهر", price: 35000, category: "حقائب", image: "🎒" },
  { id: 4, name: "كاميرا رقمية", price: 200000, category: "إلكترونيات", image: "📷" },
  { id: 5, name: "لوحة مفاتيح ميكانيكية", price: 75000, category: "إلكترونيات", image: "⌨️" },
  { id: 6, name: "نظارة شمسية", price: 25000, category: "إكسسوارات", image: "🕶️" }
];

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
// لا يُعتمد على الاسم/السعر/الفئة/الصورة المخزّنة سابقًا، فقط على معرّف المنتج والكمية
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

// الطلبات (Orders): سجلات دائمة ومستقلة عن السلة، تُنشأ فقط عند تأكيد طلب
// بخلاف السلة (قابلة للتعديل والإفراغ)، الطلب لقطة ثابتة لا تتغير بعد إنشائها
const ORDERS_STORAGE_KEY = "ali-ecommerce-orders";

// استرجاع كل الطلبات المحفوظة سابقًا من localStorage
function loadOrdersFromStorage() {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// حفظ قائمة الطلبات كاملة في localStorage
function saveOrdersToStorage(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    // localStorage غير متاح - يستمر التطبيق بدون حفظ الطلب
  }
}

// توليد معرّف فريد لكل طلب
function generateOrderId() {
  return `ORD-${Date.now()}`;
}

// بناء سجل طلب مستقل (لقطة) من حالة السلة الحالية وبيانات العميل، ثم إضافته إلى سجل الطلبات الدائم
function createOrderFromCart(customerName, customerPhone, customerAddress) {
  const items = cart.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const order = {
    orderId: generateOrderId(),
    createdAt: new Date().toISOString(),
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
    },
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
  };

  const orders = loadOrdersFromStorage();
  orders.push(order);
  saveOrdersToStorage(orders);

  return order;
}

// خفض مخزون كل منتج بعد إنشاء الطلب بنجاح، بالكمية المطلوبة فعليًا في ذلك الطلب
// لا يمس هذا سجل الطلب نفسه (لقطة ثابتة) - يؤثر فقط على الكتالوج الحيّ للمستقبل
function decreaseStockAfterOrder(order) {
  order.items.forEach((orderItem) => {
    const product = adminProducts.find((p) => p.id === orderItem.id);
    if (product) {
      product.stock = Math.max(0, product.stock - orderItem.quantity);
    }
  });

  saveAdminProductsToStorage(adminProducts);
  populateCategoryFilter();
  applyProductFilters();
}

// عرض سجل الطلبات السابقة كقائمة مختصرة (قراءة وعرض فقط، بدون أي تعديل على الطلبات)
function renderOrderHistory() {
  const ordersBody = document.getElementById("orders-body");
  if (!ordersBody) return;

  const panelTitle = document.getElementById("orders-panel-title");
  if (panelTitle) panelTitle.textContent = "طلباتي السابقة";

  ordersBody.innerHTML = "";

  const orders = loadOrdersFromStorage();

  if (orders.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "لا توجد طلبات سابقة";
    ordersBody.appendChild(emptyMessage);
    return;
  }

  // الأحدث أولًا
  orders.slice().reverse().forEach((order) => {
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

    const totalsLine = document.createElement("p");
    totalsLine.className = "order-total";
    totalsLine.textContent = `عدد القطع: ${order.itemCount} — الإجمالي: ${formatPrice(order.total)}`;

    const viewDetailsBtn = document.createElement("button");
    viewDetailsBtn.type = "button";
    viewDetailsBtn.className = "btn-view-order-details";
    viewDetailsBtn.textContent = "عرض التفاصيل";
    viewDetailsBtn.addEventListener("click", () => renderOrderDetails(order.orderId));

    card.appendChild(header);
    card.appendChild(totalsLine);
    card.appendChild(viewDetailsBtn);

    ordersBody.appendChild(card);
  });
}

// عرض تفاصيل طلب واحد بالكامل عبر معرّفه (orderId)، مع العودة إلى قائمة الطلبات
function renderOrderDetails(orderId) {
  const ordersBody = document.getElementById("orders-body");
  if (!ordersBody) return;

  const panelTitle = document.getElementById("orders-panel-title");
  if (panelTitle) panelTitle.textContent = "تفاصيل الطلب";

  ordersBody.innerHTML = "";

  const order = loadOrdersFromStorage().find((o) => o.orderId === orderId);

  if (!order) {
    const notFoundMessage = document.createElement("p");
    notFoundMessage.className = "cart-empty";
    notFoundMessage.textContent = "تعذّر العثور على هذا الطلب";
    ordersBody.appendChild(notFoundMessage);
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

    details.appendChild(header);
    details.appendChild(customerLine);
    details.appendChild(itemsList);
    details.appendChild(totalsLine);

    ordersBody.appendChild(details);
  }

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn-back-to-orders";
  backBtn.textContent = "→ العودة إلى طلباتي";
  backBtn.addEventListener("click", renderOrderHistory);

  ordersBody.appendChild(backBtn);
}

// تحديث عدد الطلبات الظاهر بجانب "إدارة الطلبات" في لوحة التحكم
function updateAdminOrdersCount(count) {
  const countEl = document.getElementById("admin-orders-count");
  if (countEl) countEl.textContent = count;
}

// عرض قائمة كل طلبات العملاء لغرض الإدارة (قراءة فقط) - نفس مخزن الطلبات الذي تقرأ منه "طلباتي"
// الأحدث أولًا، بالاعتماد على createdAt، دون أي تعديل على المصفوفة المخزَّنة نفسها
function renderAdminOrderList() {
  const listEl = document.getElementById("admin-orders-list");
  if (!listEl) return;

  const titleEl = document.getElementById("admin-orders-panel-title");
  if (titleEl) titleEl.textContent = "الطلبات";

  listEl.innerHTML = "";

  const orders = [...loadOrdersFromStorage()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  updateAdminOrdersCount(orders.length);

  if (orders.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "لا توجد طلبات حتى الآن";
    listEl.appendChild(emptyMessage);
    return;
  }

  orders.forEach((order) => {
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
    card.appendChild(totalsLine);
    card.appendChild(viewDetailsBtn);

    listEl.appendChild(card);
  });
}

// عرض تفاصيل طلب واحد لغرض الإدارة، بالاعتماد حصرًا على لقطة الطلب المخزَّنة (order.items)
// لا يُستخدم adminProducts هنا إطلاقًا: تغيّر السعر/الاسم/المخزون/الظهور الحالي لا يجب أن يغيّر طلبًا تاريخيًا
function renderAdminOrderDetails(orderId) {
  const listEl = document.getElementById("admin-orders-list");
  if (!listEl) return;

  const titleEl = document.getElementById("admin-orders-panel-title");
  if (titleEl) titleEl.textContent = "تفاصيل الطلب";

  listEl.innerHTML = "";

  const order = loadOrdersFromStorage().find((o) => o.orderId === orderId);

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

    details.appendChild(header);
    details.appendChild(customerLine);
    details.appendChild(itemsList);
    details.appendChild(totalsLine);

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

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // إعادة قراءة الكتالوج الحالي من التخزين لضمان التحقق من أحدث مخزون متاح
    // (مثال: تبويب آخر غيّر المخزون بعد فتح هذه النافذة)
    adminProducts = loadAdminProductsFromStorage();

    const hasStockIssue = cart.some((item) => {
      const product = adminProducts.find((p) => p.id === item.id);
      return !product || item.quantity > product.stock;
    });

    if (hasStockIssue) {
      resyncCartWithCatalog();
      renderCheckoutForm();

      const errorMessage = document.createElement("p");
      errorMessage.className = "checkout-stock-error";
      errorMessage.textContent =
        "تغيّرت الكمية المتوفرة لأحد المنتجات في سلتك. تم تحديث السلة تلقائيًا، الرجاء مراجعتها والمحاولة مجددًا.";
      checkoutBody.insertBefore(errorMessage, checkoutBody.firstChild);
      return;
    }

    const order = createOrderFromCart(nameInput.value, phoneInput.value, addressInput.value);
    decreaseStockAfterOrder(order);
    renderCheckoutSuccess(order);
  });

  checkoutBody.appendChild(summary);
  checkoutBody.appendChild(form);
}

// عرض رسالة نجاح الطلب بعد إرسال النموذج، بالاعتماد على سجل الطلب المحفوظ (وليس السلة)
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
// لوحة تحكم المتجر (Admin Dashboard) — أساس إدارة المنتجات
// هذا قسم منفصل تمامًا عن واجهة العميل. مصفوفة products الأصلية تبقى كما هي
// ولا تتأثر بأي عملية هنا؛ لوحة التحكم تدير نسخة إدارية خاصة بها فقط،
// كخطوة أساس تمهيدية قبل ربطها فعليًا بواجهة العميل في مرحلة قادمة.
// ==========================================================================

const ADMIN_PRODUCTS_STORAGE_KEY = "ali-ecommerce-admin-products";

let adminProducts = [];
let editingAdminProductId = null;

// التحقق من أن كائن المنتج يطابق البنية المطلوبة بالضبط (5 حقول، أنواع صحيحة)
function isValidAdminProduct(product) {
  return (
    product &&
    typeof product === "object" &&
    typeof product.id === "number" &&
    typeof product.name === "string" &&
    product.name.trim() !== "" &&
    typeof product.price === "number" &&
    product.price > 0 &&
    typeof product.category === "string" &&
    product.category.trim() !== "" &&
    typeof product.image === "string" &&
    product.image.trim() !== ""
  );
}

// القيمة الافتراضية للمخزون عند عدم وجود قيمة صالحة
const DEFAULT_STOCK = 10;

// تطبيع قيمة المخزون: عدد صحيح غير سالب فقط، وإلا تُستبدل بالقيمة الافتراضية
function normalizeStock(value, fallback = DEFAULT_STOCK) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : fallback;
}

// تحميل منتجات لوحة التحكم من localStorage، وزرعها تلقائيًا من products الأصلية أول مرة
// كل منتج يظهر للعملاء افتراضيًا (visible: true) ما لم يُخفِه المسؤول صراحةً
// وكل منتج يحصل على مخزون رقمي صالح (stock)، مع تطبيع أي قيمة قديمة أو تالفة
function loadAdminProductsFromStorage() {
  try {
    const stored = localStorage.getItem(ADMIN_PRODUCTS_STORAGE_KEY);

    if (!stored) {
      const seeded = products.map((product) => ({ ...product, visible: true, stock: DEFAULT_STOCK }));
      saveAdminProductsToStorage(seeded);
      return seeded;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      const fallback = products.map((product) => ({ ...product, visible: true, stock: DEFAULT_STOCK }));
      saveAdminProductsToStorage(fallback);
      return fallback;
    }

    const normalized = parsed.filter(isValidAdminProduct).map((product) => ({
      ...product,
      visible: typeof product.visible === "boolean" ? product.visible : true,
      stock: normalizeStock(product.stock),
    }));

    // حفظ النسخة المطبَّعة فورًا حتى تعكس البيانات المخزَّنة القيم الصحيحة من الآن فصاعدًا
    saveAdminProductsToStorage(normalized);
    return normalized;
  } catch (error) {
    return products.map((product) => ({ ...product, visible: true, stock: DEFAULT_STOCK }));
  }
}

// حفظ منتجات لوحة التحكم في localStorage
function saveAdminProductsToStorage(list) {
  try {
    localStorage.setItem(ADMIN_PRODUCTS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // localStorage غير متاح - يستمر التطبيق بدون حفظ
  }
}

// توليد معرّف رقمي جديد غير مستخدم لمنتج إداري جديد
function generateAdminProductId() {
  const maxId = adminProducts.reduce((max, product) => Math.max(max, product.id), 0);
  return maxId + 1;
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

  if (adminProducts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "لا توجد منتجات بعد";
    listEl.appendChild(emptyMessage);
    return;
  }

  adminProducts.forEach((product) => {
    const row = document.createElement("div");
    row.className = "admin-product-row";

    const info = document.createElement("div");
    info.className = "admin-product-info";
    info.textContent = `${product.image} ${product.name} — ${product.category} — ${formatPrice(product.price)}`;

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
  const product = adminProducts.find((p) => p.id === productId);
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
function toggleAdminProductVisibility(productId) {
  const product = adminProducts.find((p) => p.id === productId);
  if (!product) return;

  product.visible = !product.visible;
  saveAdminProductsToStorage(adminProducts);
  renderAdminProducts();
  refreshStorefrontAfterAdminChange();
}

// حذف منتج من لوحة التحكم عبر معرّفه
function deleteAdminProduct(productId) {
  adminProducts = adminProducts.filter((p) => p.id !== productId);
  saveAdminProductsToStorage(adminProducts);

  if (editingAdminProductId === productId) {
    cancelAdminEdit();
  }

  renderAdminProducts();
  refreshStorefrontAfterAdminChange();
}

// إضافة منتج جديد أو تحديث منتج موجود بناءً على بيانات النموذج
function saveAdminProductForm(name, price, category, image, stock) {
  if (editingAdminProductId !== null) {
    const product = adminProducts.find((p) => p.id === editingAdminProductId);
    if (product) {
      product.name = name;
      product.price = price;
      product.category = category;
      product.image = image;
      product.stock = stock;
    }
  } else {
    adminProducts.push({
      id: generateAdminProductId(),
      name,
      price,
      category,
      image,
      visible: true,
      stock,
    });
  }

  saveAdminProductsToStorage(adminProducts);
  renderAdminProducts();
  cancelAdminEdit();
  refreshStorefrontAfterAdminChange();
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
function refreshStorefrontAfterAdminChange() {
  populateCategoryFilter();
  applyProductFilters();
  resyncCartWithCatalog();
  resyncFavoritesWithCatalog();
}

document.addEventListener("DOMContentLoaded", () => {
  adminProducts = loadAdminProductsFromStorage();
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
      renderOrderHistory();
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

  if (adminDashboardLink && adminDashboardSection && mainContent) {
    adminDashboardLink.addEventListener("click", (event) => {
      event.preventDefault();
      mainContent.hidden = true;
      adminDashboardSection.hidden = false;
      renderAdminProducts();
      updateAdminOrdersCount(loadOrdersFromStorage().length);

      if (adminTabProducts && adminTabOrders && adminProductsPanel && adminOrdersPanel) {
        adminTabProducts.classList.add("active");
        adminTabOrders.classList.remove("active");
        adminProductsPanel.hidden = false;
        adminOrdersPanel.hidden = true;
      }
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

    adminTabOrders.addEventListener("click", (event) => {
      event.preventDefault();
      adminTabOrders.classList.add("active");
      adminTabProducts.classList.remove("active");
      adminProductsPanel.hidden = true;
      adminOrdersPanel.hidden = false;
      renderAdminOrderList();
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
    adminProductForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("admin-product-name").value.trim();
      const price = Number(document.getElementById("admin-product-price").value);
      const category = document.getElementById("admin-product-category").value.trim();
      const image = document.getElementById("admin-product-image").value.trim();
      const stock = Number(document.getElementById("admin-product-stock").value);

      if (!name || !category || !image || !Number.isFinite(price) || price <= 0) {
        return;
      }

      if (!Number.isInteger(stock) || stock < 0) {
        return;
      }

      saveAdminProductForm(name, price, category, image, stock);
    });
  }

  if (adminFormCancelBtn) {
    adminFormCancelBtn.addEventListener("click", cancelAdminEdit);
  }
});
