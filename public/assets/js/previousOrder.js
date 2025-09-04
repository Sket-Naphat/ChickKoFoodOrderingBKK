// Import the necessary Firebase SDKs
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

const cartItems = [];
const cartToppingItems = [];
const cartList = document.getElementById("cartItems");
const cartToppingList = document.getElementById("cartToppingItems");
const totalDisplay = document.getElementById("total");
const totalToppingDisplay = document.getElementById("totalTopping");
const cardQTY = document.getElementById("cardQTY");

// Fetch the menu when the page loads
window.onload = function() {
    getMenu();
    getTopping();
    setDefaultDateTime();
};

// ฟังก์ชันตั้งค่าวันที่และเวลาเริ่มต้น
function setDefaultDateTime() {
    const now = new Date();
    
    // ตั้งค่าวันที่เป็นวันปัจจุบัน
    const today = now.getFullYear() + '-' + 
                 String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(now.getDate()).padStart(2, '0');
    document.getElementById('dateInput').value = today;
    
    // ตั้งค่าเวลาเป็นเวลาปัจจุบัน
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + 
                       String(now.getMinutes()).padStart(2, '0');
    document.getElementById('timeInput').value = currentTime;
}


$(document).ready(function () {

    $("#menuList , #menufriedChickenList, #menuMealList, #menuNoodleList, #menuSnackList, #menuToppingList, #menuDessertList, #menuBeverageList").on("click", ".add-to-cart", function () {
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        const addTopping = $(this).data("addtopping");
        
        // ถ้าเมนูนี้สามารถเพิ่มท้อปปิ้งได้
        if (addTopping === true) {
            // เปิด modal เพื่อเลือกท้อปปิ้ง
            openToppingModal(id, name, price);
        } else {
            // เพิ่มเข้ารถเข็นโดยตรง
            addToCart(id, name, price);
        }
    });

    $("#cartItems").on("click", ".remove-item", function () {
        const id = $(this).data("id");
        removeFromCart(id);
    });

    $("#cartToppingItems").on("click", ".remove-topping", function () {
        const id = $(this).data("id");
        removeToppingFromCart(id);
    });

    $("#allToppingList").on("click", ".add-topping", function () {
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        addTopping(id, name, price);
    });

    // ปุ่มเพิ่ม/ลดจำนวน
    $("#increaseQty").on("click", function () {
        let qty = parseInt($("#addMenuQTY").val());
        $("#addMenuQTY").val(qty + 1);
    });

    $("#decreaseQty").on("click", function () {
        let qty = parseInt($("#addMenuQTY").val());
        if (qty > 1) {
            $("#addMenuQTY").val(qty - 1);
        }
    });

    // เมื่อกดปุ่มเพิ่มเมนูใน topping modal
    $("#addToppingSubmit").on("click", function () {
        const id = $("#addMenuName").data("id");
        const name = $("#addMenuName").val();
        const price = parseFloat($("#addMenuPrice").val());
        const addMenuRemark = $("#addMenuRemark").val();
        const addMenuQTY = parseInt($("#addMenuQTY").val());

        let toppingsId = "";
        let toppingsDescription = "";
        let toppingsPrice = 0;

        // เช็คว่ามีท็อปปิ้งหรือไม่
        cartToppingItems.forEach((item) => {
            toppingsId += `+${item.id}`;
            toppingsDescription += ` + ${item.name}`;
            toppingsPrice += item.price * item.quantity;
        });

        const totalID = id + toppingsId;
        const totalName = name + toppingsDescription;
        const totalPrice = price + toppingsPrice;

        addToCart(totalID, totalName, totalPrice, addMenuRemark, addMenuQTY);
        $("#addToppingModal").modal("hide");
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
                Add to cart
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
function addToCart(id, name, price, remark = '', quantity = 1) {
    // ตรวจสอบว่าสินค้าอยู่ในรถเข็นแล้วหรือไม่
    const existingItem = cartItems.find(item => item.id === id);

    if (existingItem) {
        // หากมีอยู่แล้ว เพิ่มจำนวน
        existingItem.quantity += quantity;
    } else {
        // หากยังไม่มี เพิ่มสินค้าใหม่
        cartItems.push({ 
            id, 
            name, 
            price, 
            quantity: quantity, 
            is_done: true,
            itemDischarge: false,
            remark: remark
        });
    }

    updateCart();
    clearToppingCart(); // ล้างท้อปปิ้งหลังจากเพิ่มเมนู
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
                      ${item.name} (x${item.quantity}) - ฿${(item.price * item.quantity).toFixed(2)}
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
    const selectedDate = $('#dateInput').val();
    const selectedTime = $('#timeInput').val();
    const selectedTable = $("#tableSelect").val();
    const orderRemark = $("#orderRemark").val().trim();

    // ตรวจสอบการกรอกชื่อ
    if (!customerName) {
        customerName = "ไม่ระบุชื่อ";
    }
    if (!selectedDate) {
        Swal.fire({
            title: "กรุณาระบุวันที่",
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

    const now = new Date();
    // แปลงวันที่ให้อยู่ในรูปแบบ yyyy-MM-dd
    const orderDate = selectedDate;
    
    // ใช้เวลาที่เลือกหรือเวลาปัจจุบันถ้าไม่ได้ระบุ
    let orderTime;
    if (selectedTime) {
        // ใช้เวลาที่เลือก และเพิ่มวินาที
        orderTime = selectedTime + ':00';
    } else {
        // ใช้เวลาปัจจุบันถ้าไม่ได้ระบุ
        orderTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    }

    // กำหนด locationOrder ตาม tableNumber
    let locationOrder = "forHere";
    if (selectedTable === "ta") {
        locationOrder = "takeAway";
    } else if (selectedTable === "grab") {
        locationOrder = "Grab";
    }

    // อัปเดตข้อมูล itemDischarge ใน cartItems
    const updatedItems = cartItems.map(item => ({
        ...item,
        itemDischarge: true // ตั้งค่าให้ถือว่าจ่ายเงินแล้วสำหรับ order ย้อนหลัง
    }));

    //Send to kitchen
    const orderData = {
        customerName: customerName,
        items: updatedItems,
        locationOrder: locationOrder,
        tableNumber: selectedTable,
        discharge: true,
        finishedOrder: true,
        orderDate: orderDate,
        orderTime: orderTime,
        dischargeTime: orderTime, // ใช้เวลาเดียวกันสำหรับ order ย้อนหลัง
        finishedOrderTime: orderTime, // ใช้เวลาเดียวกันสำหรับ order ย้อนหลัง
        dischargeType: 'Promptpay', // ค่าเริ่มต้นสำหรับ order ย้อนหลัง
        remark: orderRemark
    };

    try {
        addOrder(orderData);
        Swal.fire({
            title: "บันทึกสำเร็จ !",
            icon: "success"
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

// ฟังก์ชันเปิด modal เลือกท้อปปิ้ง
function openToppingModal(id, name, price) {
    $("#addMenuName").val(name).data("id", id);
    $("#addMenuPrice").val(price);
    $("#addMenuQTY").val(1);
    $("#addMenuRemark").val("");
    clearToppingCart();
    updateToppingCart(price);
    $("#addToppingModal").modal("show");
}

// ฟังก์ชันดึงข้อมูลท้อปปิ้ง
async function getTopping() {
    try {
        const menuCollection = collection(db, "menu");
        const q = query(menuCollection, where("category", "==", "Topping"));
        const menuSnapshot = await getDocs(q);

        const menuList = menuSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        menuList.sort((a, b) => a.name.localeCompare(b.name));
        displayTopping(menuList);
    } catch (error) {
        console.error("Error fetching toppings: ", error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูลท้อปปิ้ง");
    }
}

// ฟังก์ชันแสดงท้อปปิ้ง
function displayTopping(menuData) {
    const allToppingList = document.getElementById("allToppingList");
    allToppingList.innerHTML = "";

    menuData.forEach((item) => {
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

        allToppingList.appendChild(menuItem);
    });
}

// ฟังก์ชันเพิ่มท้อปปิ้ง
function addTopping(id, name, price) {
    const existingItem = cartToppingItems.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartToppingItems.push({ id, name, price, quantity: 1 });
    }

    updateToppingCart();
}

// ฟังก์ชันลบท้อปปิ้ง
function removeToppingFromCart(id) {
    const itemIndex = cartToppingItems.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        if (cartToppingItems[itemIndex].quantity > 1) {
            cartToppingItems[itemIndex].quantity -= 1;
        } else {
            cartToppingItems.splice(itemIndex, 1);

            const countElements = document.getElementsByClassName("menuToppingCount_" + id);
            Array.from(countElements).forEach((element) => {
                element.textContent = "";
            });
        }
    }

    updateToppingCart();
}

// ฟังก์ชันอัปเดตรถเข็นท้อปปิ้ง
function updateToppingCart(menuPrice = 0) {
    cartToppingList.innerHTML = "";
    let total = 0;

    cartToppingItems.forEach((item) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            ${item.name} (x${item.quantity}) - ฿${(item.price * item.quantity).toFixed(2)}
            <button class="btn btn-sm btn-danger remove-topping" data-id="${item.id}">ลบ</button>
        `;
        cartToppingList.appendChild(li);
        total += item.price * item.quantity;

        // อัปเดตจำนวนท้อปปิ้งในปุ่ม
        const countElements = document.getElementsByClassName("menuToppingCount_" + item.id);
        Array.from(countElements).forEach((element) => {
            element.textContent = item.quantity;
        });
    });

    total += menuPrice;
    totalToppingDisplay.textContent = `ราคารวมท้อปปิ้ง : ${total.toFixed(2)} THB`;
}

// ฟังก์ชันล้างรถเข็นท้อปปิ้ง
function clearToppingCart() {
    cartToppingItems.length = 0;
    updateToppingCart();
    
    // ล้างตัวนับในปุ่มท้อปปิ้งทั้งหมด
    const countElements = document.querySelectorAll('[class*="menuToppingCount_"]');
    countElements.forEach((element) => {
        element.textContent = "";
    });
}