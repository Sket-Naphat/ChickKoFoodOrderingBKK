// Import Firebase functions and centralized config
import { collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from './firebaseConfig.js';
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
// const analytics = getAnalytics(app);
const cartItems = [];
const cartToppingItems = [];
const cartList = document.getElementById("cartItems");
const cartToppingList = document.getElementById("cartToppingItems");
const totalDisplay = document.getElementById("total");
const totalToppingDisplay = document.getElementById("totalTopping");
const cardQTY = document.getElementById("cardQTY");

// Make cartItems globally accessible
window.cartItems = cartItems;


// Fetch the menu when the page loads
window.onload = getMenu;


$(document).ready(function () {

    $("#menuList , #menufriedChickenList, #menuMealList, #menuNoodleList, #menuSnackList, #menuToppingList, #menuDessertList, #menuBeverageList").on("click", ".add-to-cart", function () {
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        const addtopping = $(this).data("addtopping");

        if (!addtopping) {
            addToCart(id, name, price, "");
        }
        else {
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById("addToppingModal"));
            modal.show();

            // Update modal content
            $("#addMenuName").val(name);
            $("#addMenuPrice").val(price);
            $("#addToppingSubmit").data("id", id);
            $("#addToppingSubmit").data("name", name);
            $("#addToppingSubmit").data("price", price);
            $("#addMenuRemark").val("");
            $("#addMenuQTY").val(1);
            cartToppingItems.length = 0;
            totalToppingDisplay.textContent = "ราคารวมท้อปปิ้ง : " + price + " THB";
            $('#cartToppingItems').empty();

            getTopping();
        }

    });


    $("#cartItems").on("click", ".remove-item", function () {
        // const id = parseInt(event.target.getAttribute("data-id"), 10);
        const id = $(this).data("id");
        removeFromCart(id);
    });

    $("#allToppingList").on("click", ".add-topping", function () {
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        addTopping(id, name, price);
    });


    $("#cartToppingItems").on("click", ".remove-item", function () {
        // const id = parseInt(event.target.getAttribute("data-id"), 10);
        const id = $(this).data("id");
        removeToppingFromCart(id);
    });

    $('#addToppingSubmit').on('click', function () {
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        const addMenuRemark = $("#addMenuRemark").val();
        const addMenuQTY = $("#addMenuQTY").val();

        // ตรวจสอบว่าสินค้าอยู่ในรถเข็นแล้วหรือไม่
        let toppingsId = "";
        let toppingsDescription = "";
        let toppingsPrice = 0;

        // เช็คว่ามีท็อปปิ้งมากกว่า 1 รายการหรือไม่
        cartToppingItems.forEach((item, index) => {
            // หากไม่ใช่รายการแรก ให้เพิ่ม + ก่อน
            toppingsId += `+${item.id}`;
            toppingsDescription += ` + ${item.name}`;
            toppingsPrice += item.price * item.quantity; // คำนวณราคาท็อปปิ้ง
        });
        const totalID = id + toppingsId; // รวมชื่อเมนูหลักกับท็อปปิ้ง
        const totalName = name + toppingsDescription; // รวมชื่อเมนูหลักกับท็อปปิ้ง
        const totalPrice = price + toppingsPrice; // คำนวณราคารวมทั้งหมด


        addToCart(totalID, totalName, totalPrice, addMenuRemark,addMenuQTY);
        $('#addToppingModal').modal('hide'); // เปลี่ยน addMenuModal เป็น ID ของ modal ที่คุณใช้

    });

    $('#increaseQty').on('click', function () {
        let qtyInput = $('#addMenuQTY');
        qtyInput.val(parseInt(qtyInput.val()) + 1);
    });

    $('#decreaseQty').on('click', function () {
        let qtyInput = $('#addMenuQTY');
        if (parseInt(qtyInput.val()) > 1) { // ไม่ให้ค่าต่ำกว่า 1
            qtyInput.val(parseInt(qtyInput.val()) - 1);
        }
    });
});

// Fetch menu data from Firestore
async function getMenu() {
    try {
        const menuCollection = collection(db, "menu");
        const q = query(menuCollection, where("active", "==", true)); // เพิ่มเงื่อนไข active = true
        const menuSnapshot = await getDocs(q);

        // ดึงข้อมูลพร้อม document ID
        const menuList = menuSnapshot.docs.map(doc => ({
            id: doc.id, // ดึง document ID
            ...doc.data() // ดึงข้อมูลในเอกสาร
        }));

        // เรียงลำดับเมนูตามตัวแปล name (เรียงตามตัวอักษร)
        menuList.sort((a, b) => a.name.localeCompare(b.name));

        displayMenu(menuList); // ส่งข้อมูลไปแสดงผล
    } catch (error) {
        console.error("Error fetching menus: ", error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูลเมนู");
    }
}


// Display the menu on the page
function displayMenu(menuData) {
    // กำหนด container สำหรับทุกหมวดหมู่
    const allMenuContainer = document.getElementById("menuList");
    const menufriedChickenContainer = document.getElementById("menufriedChickenList");
    const menuMealContainer = document.getElementById("menuMealList");
    const menuNoodleContainer = document.getElementById("menuNoodleList");
    const menuSnackContainer = document.getElementById("menuSnackList");
    const menuToppingContainer = document.getElementById("menuToppingList");
    const menuDessertContainer = document.getElementById("menuDessertList");
    const menuBeverageContainer = document.getElementById("menuBeverageList");

    // ล้างเนื้อหาเก่าก่อนเพิ่มใหม่
    allMenuContainer.innerHTML = "";
    menufriedChickenContainer.innerHTML = "";
    menuMealContainer.innerHTML = "";
    menuNoodleContainer.innerHTML = "";
    menuSnackContainer.innerHTML = "";
    menuToppingContainer.innerHTML = "";
    menuDessertContainer.innerHTML = "";
    menuBeverageContainer.innerHTML = "";

    // วนลูปผ่านข้อมูลเมนู
    menuData.forEach(item => {
        const imgMenu = item.imgPath && item.imgPath.trim() !== ''
            ? item.imgPath
            : 'assets/img/ChickKoImg.jpg';

        const menuItem = document.createElement("div");
        menuItem.className = "col mb-5 position-relative";

        menuItem.innerHTML = `
          <div class="card h-100">
            <img class="card-img-top custom-img" src="${imgMenu}" alt="${item.name}" />
            <div class="card-body p-2">
              <div class="text-center">
                <h5 class="fw-bolder">${item.name}</h5>
                <p>${item.price} THB</p>
              </div>
            </div>
            <div class="card-footer p-2 pt-0 border-top-0 bg-transparent text-center">
              <button type="button" class="btn btn-outline-dark add-to-cart" 
                      data-id="${item.id}" 
                      data-name="${item.name}" 
                      data-price="${item.price}"
                      data-addtopping="${item.addTopping}">
                Add to Cart
                <span class="menuCount_${item.id} badge bg-primary text-white ms-1 rounded-pill "></span>
              </button>
              
            </div>
          </div>
        `;

        // เพิ่มสินค้าไปยัง "All"
        allMenuContainer.appendChild(menuItem.cloneNode(true));

        // ตรวจสอบหมวดหมู่และเพิ่มไปยัง container ที่เหมาะสม
        if (item.category === 'FriedChicken') {
            menufriedChickenContainer.appendChild(menuItem.cloneNode(true));
        } else if (item.category === 'Meal') {
            menuMealContainer.appendChild(menuItem.cloneNode(true));
        } else if (item.category === 'Noodle') {
            menuNoodleContainer.appendChild(menuItem.cloneNode(true));
        } else if (item.category === 'Snack') {
            menuSnackContainer.appendChild(menuItem.cloneNode(true));
        } else if (item.category === 'Topping') {
            menuToppingContainer.appendChild(menuItem.cloneNode(true));
        } else if (item.category === 'Dessert') {
            menuDessertContainer.appendChild(menuItem.cloneNode(true));
        } else if (item.category === 'Beverage') {
            menuBeverageContainer.appendChild(menuItem.cloneNode(true));
        }
    });
}


// ฟังก์ชันเพิ่มสินค้าไปยังรถเข็น
function addToCart(id, name, price, addMenuRemark = "",addMenuQTY = 1) {
    // ตรวจสอบว่าสินค้าอยู่ในรถเข็นแล้วหรือไม่
    const existingItem = cartItems.find(item => item.id === id);

    if (Number(addMenuQTY) < 1) {
        addMenuQTY = 1; // รีเซ็ตเป็น 1 ถ้าค่าต่ำกว่า 1
    }
    if (existingItem) {
        // หากมีอยู่แล้ว เพิ่มจำนวน

        if(existingItem.remark != addMenuRemark){
            cartItems.push({ id, name, price, quantity: Number(addMenuQTY), is_done: false, remark: addMenuRemark ,itemDischarge: false});
        }
        else{
            existingItem.quantity += Number(addMenuQTY);
        }
        
    } else {
        // หากยังไม่มี เพิ่มสินค้าใหม่
        cartItems.push({ id, name, price, quantity: Number(addMenuQTY), is_done: false, remark: addMenuRemark ,itemDischarge: false});
    }

    updateCart();
}



// ฟังก์ชันลบสินค้าออกจากรถเข็น
function removeFromCart(id) {
    const itemIndex = cartItems.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        // ลดจำนวนสินค้า
        if (cartItems[itemIndex].quantity > 1) {
            cartItems[itemIndex].quantity -= 1;
        } else {
            // หากจำนวนเหลือ 1 ชิ้น ให้ลบออกจากรถเข็น
            cartItems.splice(itemIndex, 1);

            const countElements = document.getElementsByClassName("menuCount_" + id);
            Array.from(countElements).forEach(element => {
                element.textContent = ""; // อัปเดตจำนวนสินค้า
            });
        }
    }

    updateCart();
}

// ฟังก์ชันอัปเดตรถเข็น
function updateCart() {
    // เคลียร์รายการเก่า
    cartList.innerHTML = "";
    let total = 0;
    let QTY = 0;

    // แสดงรายการสินค้า
    cartItems.forEach(item => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
                       ${item.name} ${item.remark ? '(' + item.remark + ')' : ''}  (x${item.quantity}) - ฿${(item.price * item.quantity).toFixed(2)}
                      <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">ลบ</button>
                  `;
        cartList.appendChild(li);
        total += item.price * item.quantity;
        QTY += item.quantity;

        // อัปเดตจำนวนสินค้าในทุกแท็บ
        const countElements = document.getElementsByClassName("menuCount_" + item.id);
        Array.from(countElements).forEach(element => {
            element.textContent = item.quantity; // อัปเดตจำนวนสินค้า
        });
    });

    // แสดงยอดรวม
    totalDisplay.textContent = `ยอดรวม: ${total.toFixed(2)} THB`;
    cardQTY.textContent = QTY;
}




// Set up the order button
document.getElementById("orderSubmit").addEventListener("click", function () {

    Swal.fire({
        title: "ยืนยันรายการ?",
        //text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#198754",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ปิด",
        allowOutsideClick: false, // ปิดการคลิกข้างนอกเพื่อไม่ให้ปิด
        reverseButtons: true // สลับตำแหน่งปุ่ม
    }).then((result) => {
        if (result.isConfirmed) {

            sendOrderToKitchen();

        }
    });

});

function sendOrderToKitchen() {
    // ดึงค่าจากฟอร์ม
    var customerName = $("#customerName").val().trim();

    var locationOrder = $("input[name='locationRadioOptions']:checked").val();
    var tableNumber = $("#tableNumberDropdown").val();
    var orderRemark = $("#orderRemark").val().trim();
    // ตรวจสอบการกรอกชื่อ
    if (!customerName) {
        Swal.fire({
            title: "ใส่ชื่อ หรือ หมายเลขโต๊ะ",
            icon: "warning"
        })
        return;
    }

    // ตรวจสอบว่ามีสินค้าในรถเข็นหรือไม่
    if (cartItems.length === 0) {
        Swal.fire({
            title: "กรุณาเพิ่มสินค้าในรถเข็นก่อนยืนยัน Order",
            icon: "warning"
        })
        return;
    }
    if (locationOrder == "takeAway") {
        tableNumber = "ta";
    }
    if (locationOrder == "Grab") {
        tableNumber = "grab";
    }
    const now = new Date();
    // แปลงวันที่ให้อยู่ในรูปแบบ yyyy-MM-dd
    const orderDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    // แปลงเวลาให้อยู่ในรูปแบบ HH:mm:ss
    const orderTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    // Update itemDischarge for all items if payment is confirmed
    let updatedItems = cartItems.map(item => ({
        ...item,
        itemDischarge: window.orderWithPayment || false
    }));

    // Calculate total amount (with discount if applied)
    let totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let finalAmount = totalAmount;
    let discountAmount = 0;
    
    if (window.orderWithPayment && window.discountApplied) {
        discountAmount = totalAmount * 0.1; // 10% discount
        finalAmount = totalAmount - discountAmount;
    }

    console.log('Order Data - Total:', totalAmount, 'Discount:', discountAmount, 'Final:', finalAmount, 'DiscountApplied:', window.discountApplied);

    //Send to kitchen
    const orderData = {
        customerName: customerName,
        items: updatedItems,
        locationOrder: locationOrder,
        discharge: window.orderWithPayment || false,
        dischargeType: window.orderWithPayment ? (window.dischargeType || '') : '',
        finishedOrder: false,
        orderDate: orderDate,
        orderTime: orderTime,
        dischargeTime: window.orderWithPayment ? orderTime : '',
        finishedOrderTime: '',
        remark: orderRemark,
        tableNumber: tableNumber,
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        discountApplied: window.orderWithPayment ? (window.discountApplied || false) : false
    };

    try {
        addOrder(orderData);
        
        // Reset payment flags
        window.orderWithPayment = false;
        window.discountApplied = false;
        window.dischargeType = '';
        
        Swal.fire({
            title: "บันทึกสำเร็จ !",
            icon: "success",
            timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
            timerProgressBar: true,
            showConfirmButton: false
        }).then(() => {
            location.reload();
        });
    } catch (error) {
        Swal.fire({
            title: "เกิดข้อผิดพลาด โปรดแจ้งพี่สเก็ต",
            text: error,
            icon: "error"
        })

    }

}

// ฟังก์ชันเพิ่มคำสั่ง
async function addOrder(orderData) {
    try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Order added with ID: ", docRef.id);
    } catch (error) {
        console.error("Error adding order: ", error);
    }
}

// Fetch menu data from Firestore
async function getTopping() {
    try {
        const menuCollection = collection(db, "menu");
        const q = query(menuCollection, where("category", "==", "Topping")); // เพิ่มเงื่อนไข active = true
        const menuSnapshot = await getDocs(q);

        // ดึงข้อมูลพร้อม document ID
        const menuList = menuSnapshot.docs.map(doc => ({
            id: doc.id, // ดึง document ID
            ...doc.data() // ดึงข้อมูลในเอกสาร
        }));

        // เรียงลำดับเมนูตามตัวแปล name (เรียงตามตัวอักษร)
        menuList.sort((a, b) => a.name.localeCompare(b.name));

        displayTopping(menuList); // ส่งข้อมูลไปแสดงผล
    } catch (error) {
        console.error("Error fetching menus: ", error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูลเมนู");
    }
}
function displayTopping(menuData) {
    // กำหนด container สำหรับทุกหมวดหมู่
    const allToppingList = document.getElementById("allToppingList");


    // ล้างเนื้อหาเก่าก่อนเพิ่มใหม่
    allToppingList.innerHTML = "";


    // วนลูปผ่านข้อมูลเมนู
    menuData.forEach(item => {

        // สร้างรายการในรูปแบบ list item
        const menuItem = document.createElement("li");
        menuItem.className = "list-group-item d-flex justify-content-between align-items-center";

        menuItem.innerHTML = `
            <div class="d-flex flex-column">
                <span class="fw-bold">${item.name}</span>
                <span class="text-muted">ราคา: ${item.price} THB</span>
            </div>
            <button type="button" class="btn btn-outline-dark add-topping ms-3" 
                data-id="${item.id}" 
                data-name="${item.name}" 
                data-price="${item.price}">
                ADD
                <span class="menuToppingCount_${item.id} badge bg-primary text-white ms-1 rounded-pill"></span>
            </button>
        `;


        // เพิ่มสินค้าไปยัง "All"
        allToppingList.appendChild(menuItem.cloneNode(true));
    });
}
function addTopping(id, name, price) {
    // ตรวจสอบว่าสินค้าอยู่ในรถเข็นแล้วหรือไม่
    const existingItem = cartToppingItems.find(item => item.id === id);

    if (existingItem) {
        // หากมีอยู่แล้ว เพิ่มจำนวน
        existingItem.quantity += 1;
    } else {
        // หากยังไม่มี เพิ่มสินค้าใหม่
        cartToppingItems.push({ id, name, price, quantity: 1, is_done: false });
    }

    updateToppingCart();

    const addButton = $(`.add-topping[data-id="${id}"]`);
    addButton.hide(); // ซ่อนปุ่ม
}


// ฟังก์ชันอัปเดตรถเข็น
function updateToppingCart() {
    // เคลียร์รายการเก่า
    cartToppingList.innerHTML = "";
    let total = 0;
    let QTY = 0;
    let menuPrice = parseFloat($("#addMenuPrice").val()) || 0; // แปลงเป็นตัวเลข และใช้ค่าเริ่มต้นเป็น 0 หากไม่มีค่า
    // แสดงรายการสินค้า
    cartToppingItems.forEach(item => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
                      ${item.name} (x${item.quantity}) - ฿${(item.price * item.quantity).toFixed(2)}
                      <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">ลบ</button>
                  `;
        cartToppingList.appendChild(li);
        total += item.price * item.quantity;
        QTY += item.quantity;

        // อัปเดตจำนวนสินค้าในทุกแท็บ
        const countElements = document.getElementsByClassName("menuToppingCount_" + item.id);
        Array.from(countElements).forEach(element => {
            element.textContent = item.quantity; // อัปเดตจำนวนสินค้า
        });
    });

    total += menuPrice;
    // แสดงยอดรวม
    totalToppingDisplay.textContent = `ราคารวมท้อปปิ้ง : ${total.toFixed(2)} THB`;
}

function removeToppingFromCart(id) {
    const itemIndex = cartToppingItems.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        // ลดจำนวนสินค้า
        if (cartToppingItems[itemIndex].quantity > 1) {
            cartToppingItems[itemIndex].quantity -= 1;
        } else {
            // หากจำนวนเหลือ 1 ชิ้น ให้ลบออกจากรถเข็น
            cartToppingItems.splice(itemIndex, 1);

            const countElements = document.getElementsByClassName("menuToppingCount_" + id);
            Array.from(countElements).forEach(element => {
                element.textContent = ""; // อัปเดตจำนวนสินค้า
            });
        }
    }


    updateToppingCart();

    const addButton = $(`.add-topping[data-id="${id}"]`);
    addButton.show(); // ซ่อนปุ่ม
}

// Payment Modal functionality
let currentTotal = 0;
let discountApplied = false;

// Make discount accessible globally
window.discountApplied = false;

// Show/hide scroll to top button and manage cart button position
window.addEventListener('scroll', function() {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const cartButtonContainer = document.getElementById('cartButtonContainer');
  const scrollY = window.scrollY;
  
  // Handle scroll to top button
  if (scrollY > 300) {
    scrollToTopBtn.style.display = 'block';
  } else {
    scrollToTopBtn.style.display = 'none';
  }
  
  // Handle cart button position
  if (scrollY > 150) {
    // When scrolled down, stick to top
    cartButtonContainer.style.top = '20px';
  } else {
    // When at top, return to original position (25% from top)
    cartButtonContainer.style.top = '';
  }
});

// Scroll to top functionality
document.getElementById('scrollToTopBtn').addEventListener('click', function() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Show payment modal when orderSubmitWithPurchase is clicked
document.getElementById('orderSubmitWithPurchase').addEventListener('click', function() {
  // Validate form first
  const customerName = document.getElementById('customerName').value.trim();
  if (!customerName) {
    Swal.fire({
      title: "ใส่ชื่อ หรือ หมายเลขโต๊ะ",
      icon: "warning"
    });
    return;
  }

  // Check if cart has items
  if (window.cartItems && window.cartItems.length === 0) {
    Swal.fire({
      title: "กรุณาเพิ่มสินค้าในรถเข็นก่อนยืนยัน Order",
      icon: "warning"
    });
    return;
  }

  // Copy data to payment modal
  document.getElementById('paymentCustomerName').value = customerName;
  updatePaymentModal();
  
  // Close cart modal and show payment modal
  const cartModal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
  if (cartModal) {
    cartModal.hide();
  }
  
  setTimeout(() => {
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    paymentModal.show();
  }, 300);
});

// Calculate change button
document.getElementById('calculateChangeBtn').addEventListener('click', function() {
  const total = discountApplied ? currentTotal * 0.9 : currentTotal;
  document.getElementById('totalAmount').value = total.toFixed(2);
  
  const changeModal = new bootstrap.Modal(document.getElementById('changeModal'));
  changeModal.show();
});

// Apply discount button
document.getElementById('applyDiscountBtn').addEventListener('click', function() {
  discountApplied = !discountApplied;
  window.discountApplied = discountApplied; // Update global variable
  updatePaymentModal();
  
  const btn = document.getElementById('applyDiscountBtn');
  if (discountApplied) {
    btn.textContent = 'ยกเลิกส่วนลด';
    btn.className = 'btn btn-warning';
  } else {
    btn.textContent = 'คิดส่วนลด 10%';
    btn.className = 'btn btn-info';
  }
});

// Calculate change functionality
document.getElementById('calculateChange').addEventListener('click', function() {
  const receivedAmount = parseFloat(document.getElementById('receivedAmount').value) || 0;
  const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
  const change = receivedAmount - totalAmount;
  
  if (change >= 0) {
    document.getElementById('changeResult').textContent = `เงินทอน: ${change.toFixed(2)} THB`;
    document.getElementById('changeResult').className = 'alert alert-success fs-5';
  } else {
    document.getElementById('changeResult').textContent = `ขาด: ${Math.abs(change).toFixed(2)} THB`;
    document.getElementById('changeResult').className = 'alert alert-danger fs-5';
  }
});

// Auto calculate change when received amount changes
document.getElementById('receivedAmount').addEventListener('input', function() {
  document.getElementById('calculateChange').click();
});

// Discharge submit from payment modal
document.getElementById('dischargeSubmit').addEventListener('click', function() {
  submitOrderWithPayment();
});

// Discharge submit from change modal
document.getElementById('dischargeChangeSubmit').addEventListener('click', function() {
  const receivedAmount = parseFloat(document.getElementById('receivedAmount').value) || 0;
  const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
  
  if (receivedAmount < totalAmount) {
    alert('จำนวนเงินที่รับไม่เพียงพอ');
    return;
  }
  
  // Close change modal
  const changeModal = bootstrap.Modal.getInstance(document.getElementById('changeModal'));
  if (changeModal) {
    changeModal.hide();
  }
  
  submitOrderWithPayment();
});

function updatePaymentModal() {
  // Get cart items from the global variable
  if (!window.cartItems) return;
  
  const paymentOrderItems = document.getElementById('paymentOrderItems');
  paymentOrderItems.innerHTML = '';
  currentTotal = 0;

  window.cartItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      ${item.name} ${item.remark ? '(' + item.remark + ')' : ''} (x${item.quantity}) - ฿${(item.price * item.quantity).toFixed(2)}
    `;
    paymentOrderItems.appendChild(li);
    currentTotal += item.price * item.quantity;
  });

  // Update totals
  document.getElementById('paymentTotal').textContent = `ยอดรวม: ${currentTotal.toFixed(2)} THB`;
  
  if (discountApplied) {
    const discountedTotal = currentTotal * 0.9;
    document.getElementById('paymentTotalWithDiscount').textContent = `หลังหักส่วนลด 10%: ${discountedTotal.toFixed(2)} THB`;
    document.getElementById('paymentTotalWithDiscount').style.display = 'block';
  } else {
    document.getElementById('paymentTotalWithDiscount').style.display = 'none';
  }
}

async function submitOrderWithPayment() {
  console.log('submitOrderWithPayment called, discountApplied:', discountApplied);
  
  // แสดง Swal เพื่อยืนยันการจ่ายเงิน
  const result = await Swal.fire({
    title: "ยืนยันการจ่ายเงิน?",
    text: "คุณต้องการเลือกวิธีการชำระเงินสำหรับออเดอร์นี้หรือไม่?",
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonColor: "#3085d6",
    denyButtonColor: "#f39c12", 
    cancelButtonColor: "#d33",
    confirmButtonText: "โอนจ่าย ,ยืนยัน",
    denyButtonText: "เงินสด ,ยืนยัน",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    // โอนจ่าย
    window.orderWithPayment = true;
    window.discountApplied = discountApplied; // Use local discountApplied value
    window.dischargeType = 'Promptpay';
    
    console.log('Promptpay selected, window.discountApplied:', window.discountApplied);
    
    // Close payment modal
    const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
    if (paymentModal) {
      paymentModal.hide();
    }
    
    // Close change modal if open
    const changeModal = bootstrap.Modal.getInstance(document.getElementById('changeModal'));
    if (changeModal) {
      changeModal.hide();
    }
    
    // Call sendOrderToKitchen directly
    sendOrderToKitchen();
    
  } else if (result.isDenied) {
    // เงินสด
    window.orderWithPayment = true;
    window.discountApplied = discountApplied; // Use local discountApplied value
    window.dischargeType = 'Cash';
    
    console.log('Cash selected, window.discountApplied:', window.discountApplied);
    
    // Close payment modal
    const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
    if (paymentModal) {
      paymentModal.hide();
    }
    
    // Close change modal if open
    const changeModal = bootstrap.Modal.getInstance(document.getElementById('changeModal'));
    if (changeModal) {
      changeModal.hide();
    }
    
    // Call sendOrderToKitchen directly
    sendOrderToKitchen();
  }
  // ถ้ายกเลิก ไม่ทำอะไร
}