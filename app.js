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

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "btn-add-cart";
  addToCartBtn.textContent = "أضف إلى السلة";
  addToCartBtn.addEventListener("click", () => addToCart(product.id));

  card.appendChild(image);
  card.appendChild(name);
  card.appendChild(category);
  card.appendChild(price);
  card.appendChild(addToCartBtn);

  return card;
}

// عرض قائمة المنتجات داخل الحاوية في الصفحة
function renderProducts(productList) {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "";
  productList.forEach((product) => {
    container.appendChild(createProductCard(product));
  });
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

// استرجاع السلة المحفوظة من localStorage وإعادة بنائها من مصدر الحقيقة الوحيد: مصفوفة products
// لا يُعتمد على الاسم/السعر/الفئة/الصورة المخزّنة سابقًا، فقط على معرّف المنتج والكمية
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];

    const quantitiesById = new Map();

    parsed.forEach((storedItem) => {
      if (!storedItem || typeof storedItem !== "object") return;

      const product = products.find((p) => p.id === storedItem.id);
      if (!product) return; // معرّف منتج غير موجود في الكتالوج الحالي - يُتجاهل

      const quantity = Number(storedItem.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return; // كمية غير صالحة - تُتجاهل

      quantitiesById.set(product.id, (quantitiesById.get(product.id) || 0) + quantity);
    });

    return products
      .filter((product) => quantitiesById.has(product.id))
      .map((product) => ({ ...product, quantity: quantitiesById.get(product.id) }));
  } catch (error) {
    return [];
  }
}

// إضافة منتج إلى السلة عن طريق معرّفه، أو زيادة الكمية إذا كان موجودًا مسبقًا
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const cartItem = cart.find((item) => item.id === productId);
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
    const order = createOrderFromCart(nameInput.value, phoneInput.value, addressInput.value);
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

document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  cart = loadCartFromStorage();
  refreshCartUI();

  const cartToggle = document.getElementById("cart-toggle");
  const cartOverlay = document.getElementById("cart-overlay");
  const closeCartBtn = document.getElementById("close-cart");
  const clearCartBtn = document.getElementById("clear-cart");
  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutOverlay = document.getElementById("checkout-overlay");
  const closeCheckoutBtn = document.getElementById("close-checkout");
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
});
