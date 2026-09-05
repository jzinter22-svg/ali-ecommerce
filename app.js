// بيانات المنتجات (مصدر بيانات وهمي في الذاكرة، لا يوجد اتصال بخادم أو قاعدة بيانات)
const products = [
  { id: 1, name: "سماعات لاسلكية", price: 150, category: "إلكترونيات", image: "🎧" },
  { id: 2, name: "ساعة ذكية", price: 320, category: "إلكترونيات", image: "⌚" },
  { id: 3, name: "حقيبة ظهر", price: 90, category: "حقائب", image: "🎒" },
  { id: 4, name: "كاميرا رقمية", price: 540, category: "إلكترونيات", image: "📷" },
  { id: 5, name: "لوحة مفاتيح ميكانيكية", price: 210, category: "إلكترونيات", image: "⌨️" },
  { id: 6, name: "نظارة شمسية", price: 60, category: "إكسسوارات", image: "🕶️" }
];

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
  price.textContent = `${product.price} ر.س`;

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

  updateCartCount();
}

// تحديث عدد القطع الظاهر بجانب "سلة التسوق"
function updateCartCount() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
}

document.addEventListener("DOMContentLoaded", () => {
  renderProducts(products);
  updateCartCount();
});

// ملاحظة: صفحة عرض السلة، حذف المنتجات، وإتمام الشراء ستُضاف في مرحلة قادمة.
