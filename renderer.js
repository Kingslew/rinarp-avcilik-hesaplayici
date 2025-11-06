// Firebase v10 (veya v9+) modüler kütüphanelerini içe aktar
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================================
// ==========================================================
// === BURAYA KENDİ FİREBASE BİLGİLERİNİZİ YAPIŞTIRIN ===
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyAW1m3YmS9GGEFHdvq88pVkaLGDxOD4hQk",
  authDomain: "rina-avcilik-hesaplayici.firebaseapp.com",
  projectId: "rina-avcilik-hesaplayici",
  storageBucket: "rina-avcilik-hesaplayici.firebasestorage.app",
  messagingSenderId: "1082525247659",
  appId: "1:1082525247659:web:7bfce1a65f78bd3141efee"
};
// ==========================================================
// ==========================================================


// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global değişkenler
let itemPrices = {}; // Fiyatlar Firebase'den buraya yüklenecek
let cart = {};

// HTML Elementlerini seçme
const itemSelect = document.getElementById('item-select');
const itemQuantity = document.getElementById('item-quantity');
const addToCartBtn = document.getElementById('add-to-cart');
const cartItemsList = document.getElementById('cart-items');
const clearCartBtn = document.getElementById('clear-cart');
const totalPriceEl = document.getElementById('total-price');
const totalAmountInput = document.getElementById('total-amount');
const percentageSelect = document.getElementById('percentage-select');
const calculatePercentageBtn = document.getElementById('calculate-percentage');
const percentageResultEl = document.getElementById('percentage-result');
const statusBar = document.getElementById('status-bar');


// --- UYGULAMA BAŞLANGIÇ FONKSİYONU ---
document.addEventListener('DOMContentLoaded', async () => {
    updateStatus("Fiyatlar Firebase'den çekiliyor...", "loading");
    
    try {
        // Veritabanı yolu: "prices" koleksiyonu, "currentList" belgesi
        const pricesRef = doc(db, "prices", "currentList");
        const docSnap = await getDoc(pricesRef);

        if (docSnap.exists()) {
            itemPrices = docSnap.data(); 
            populateItemSelect(); // <-- Açılır menüyü doldurur
            updateStatus("Fiyatlar başarıyla yüklendi!", "success");
        } else {
            updateStatus("HATA: Fiyat listesi (prices/currentList) bulunamadı!", "error");
        }
    } catch (error) {
        console.error("Firebase'den veri çekerken hata: ", error);
        updateStatus("HATA: Veritabanına bağlanılamadı. İnternetinizi kontrol edin.", "error");
    }
});

// Açılır menüyü (select) dolduran fonksiyon
function populateItemSelect() {
    itemSelect.innerHTML = ''; // "Yükleniyor..." yazısını temizle
    itemSelect.innerHTML = '<option value="">--- Ürün Seçin ---</option>';

    if (Object.keys(itemPrices).length === 0) {
        itemSelect.innerHTML = '<option value="">Fiyat listesi boş</option>';
        return;
    }
    
    // Fiyatları alfabetik olarak sırala
    const sortedItemNames = Object.keys(itemPrices).sort();

    for (const itemName of sortedItemNames) {
        const option = document.createElement('option');
        option.value = itemName;
        // Küsüratlı fiyatı göstermesi için formatCurrency çağrılıyor
        option.textContent = `${itemName} (${formatCurrency(itemPrices[itemName])})`;
        itemSelect.appendChild(option);
    }
}

// Durum çubuğunu güncelle
function updateStatus(message, type) {
    statusBar.textContent = message;
    statusBar.className = `status-bar status-${type}`;
    
    // Başarılıysa 2 saniye sonra gizle (isteğe bağlı)
    if (type === "success") {
        setTimeout(() => {
            statusBar.style.transition = "opacity 0.5s ease";
            statusBar.style.opacity = "0";
            setTimeout(() => { statusBar.style.display = 'none'; }, 500);
        }, 2000);
    } else {
         statusBar.style.display = 'block';
         statusBar.style.opacity = "1";
    }
}


// --- HESAPLAMA VE SEPET FONKSİYONLARI ---

// Sepete Ekle Butonu
addToCartBtn.addEventListener('click', () => {
    // Seçili ürünü açılır menüden al
    const selectedItem = itemSelect.value;
    
    if (!selectedItem || !itemPrices[selectedItem]) {
        alert("Lütfen geçerli bir ürün seçin.");
        return;
    }
    
    const quantity = parseInt(itemQuantity.value, 10);
    if (isNaN(quantity) || quantity <= 0) {
        alert("Lütfen geçerli bir miktar girin.");
        return;
    }

    // Sepette varsa adedi ekle, yoksa yeni oluştur
    if (cart[selectedItem]) {
        cart[selectedItem] += quantity;
    } else {
        cart[selectedItem] = quantity;
    }

    itemQuantity.value = ''; // Miktar kutusunu temizle
    itemSelect.value = ''; // Seçim menüsünü başa al
    renderCart(); // Sepeti güncelle
});

// Sepeti Temizle Butonu
clearCartBtn.addEventListener('click', () => {
    if (Object.keys(cart).length === 0) return; // Sepet zaten boşsa bir şey yapma
    if (confirm("Sepeti tamamen temizlemek istediğinizden emin misiniz?")) {
        cart = {};
        renderCart();
    }
});

// Yüzdelik Hesapla Butonu
calculatePercentageBtn.addEventListener('click', () => {
    const total = parseFloat(totalAmountInput.value) || 0;
    const percentage = parseFloat(percentageSelect.value) || 0;

    if (total === 0) {
        alert("Hesaplama yapmak için önce sepetinize ürün ekleyin.");
        return;
    }
    if (percentage === 0) {
        alert("Lütfen bir oran seçin.");
        return;
    }

    const changeAmount = total * (percentage / 100);
    const finalAmount = total + changeAmount;

    percentageResultEl.innerHTML = `<strong>Sonuç: ${formatCurrency(finalAmount)}</strong> 
                                     <br><small style="color: #e0e0e0;">(${(changeAmount >= 0 ? '+' : '')}${formatCurrency(changeAmount)})</small>`;
});

// Sepeti Ekrana Çizen Fonksiyon
function renderCart() {
    cartItemsList.innerHTML = '';
    let currentTotal = 0;

    // Sepet boşsa
    if (Object.keys(cart).length === 0) {
        cartItemsList.innerHTML = '<li>Sepetiniz boş.</li>';
        updateTotal(0);
        return;
    }

    // Sepeti doldur
    for (const itemName in cart) {
        const quantity = cart[itemName];
        const price = itemPrices[itemName];
        
        if (!price) {
            console.warn(`"${itemName}" ürünü fiyat listesinde bulunamadı.`);
            continue; 
        }

        const itemTotal = quantity * price;
        currentTotal += itemTotal;

        const li = document.createElement('li');
        li.innerHTML = `
            <span class="item-name">${itemName} x ${quantity}</span>
            <span class="item-controls">
                <strong>${formatCurrency(itemTotal)}</strong>
                <button class="btn btn-danger btn-sm" data-itemname="${itemName}">Sil</button>
            </span>
        `;
        cartItemsList.appendChild(li);
    }

    // Sepetteki "Sil" butonlarına olay ekle
    cartItemsList.querySelectorAll('.btn-danger').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemName = e.target.dataset.itemname;
            removeFromCart(itemName);
        });
    });

    updateTotal(currentTotal);
}

// Sepetten Tek Ürün Silme
function removeFromCart(itemName) {
    if (cart[itemName]) {
        delete cart[itemName];
        renderCart();
    }
}

// Toplam Fiyatı Güncelleme
function updateTotal(total) {
    totalPriceEl.textContent = formatCurrency(total);
    // Yüzdelik hesaplayıcıya da küsüratlı (ham) değeri ata
    totalAmountInput.value = total.toFixed(2); // .toFixed(2) ile 1383.2 gibi gösterir
    percentageResultEl.innerHTML = '<strong>Sonuç: 0 $</strong>'; // Sepet değişince sonucu sıfırla
}

// Para Birimini Formatlama (örn: 1456.50 -> 1.456,50 $)
function formatCurrency(number) {
    // Para birimini TL olarak formatla, ama simgeyi $ yap
    return new Intl.NumberFormat('tr-TR', { 
        style: 'decimal', 
        minimumFractionDigits: 0, // Küsürat yoksa gösterme (örn: 150)
        maximumFractionDigits: 2  // Küsürat varsa 2 basamağa kadar göster (örn: 150,5 veya 150,55)
    }).format(number) + ' $';
}