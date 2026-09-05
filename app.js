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

// سلة التسوق (مصفوفة في الذاكرة فقط، بدون تخزين أو خادم)
let cart = [];

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

// تحديث كامل واجهة السلة بعد أي تغيير عليها
function refreshCartUI() {
  updateCartCount();
  renderCart();
  updateCartTotal();
}

document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  refreshCartUI();

  const cartToggle = document.getElementById("cart-toggle");
  const cartOverlay = document.getElementById("cart-overlay");
  const closeCartBtn = document.getElementById("close-cart");
  const clearCartBtn = document.getElementById("clear-cart");

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
});

// ملاحظة: إتمام الشراء (checkout) سيُضاف في مرحلة قادمة.
