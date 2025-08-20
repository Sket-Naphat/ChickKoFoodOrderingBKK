// Import the necessary Firebase SDKs
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
// Your Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyB2v4UuQABJJc9VxA5YKSDoeEpY00NE8Tw",
//     authDomain: "chickkoapp.firebaseapp.com",
//     projectId: "chickkoapp",
//     storageBucket: "chickkoapp.firebasestorage.app",
//     messagingSenderId: "94867797048",
//     appId: "1:94867797048:web:954a36ceacbcbbc5fbe2cd",
//     measurementId: "G-8VPWXNX4SS"
// };
const firebaseConfig = {
  apiKey: "AIzaSyCDzE1eNH7x-4vYR4-bdKsV13E30x-5BsQ",
  authDomain: "chick-ko-bkk.firebaseapp.com",
  projectId: "chick-ko-bkk",
  storageBucket: "chick-ko-bkk.firebasestorage.app",
  messagingSenderId: "581157913930",
  appId: "1:581157913930:web:90365f413c1ab884612db3"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const cartItems = [];
const cartList = document.getElementById("cartItems");
const totalDisplay = document.getElementById("total");
const cardQTY = document.getElementById("cardQTY");


// Fetch the menu when the page loads
window.onload = getMenu;


$(document).ready(function () {

    $("#menuList , #menufriedChickenList, #menuMealList, #menuSnackList, #menuToppingList, #menuDessertList, #menuBeverageList").on("click", ".add-to-cart", function () {
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        addToCart(id, name, price);
    });


    $("#cartItems").on("click", ".remove-item", function () {
        // const id = parseInt(event.target.getAttribute("data-id"), 10);
        const id = $(this).data("id");
        removeFromCart(id);
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
    const menuSnackContainer = document.getElementById("menuSnackList");
    const menuToppingContainer = document.getElementById("menuToppingList");
    const menuDessertContainer = document.getElementById("menuDessertList");
    const menuBeverageContainer = document.getElementById("menuBeverageList");

    // ล้างเนื้อหาเก่าก่อนเพิ่มใหม่
    allMenuContainer.innerHTML = "";
    menufriedChickenContainer.innerHTML = "";
    menuMealContainer.innerHTML = "";
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
                      data-price="${item.price}">
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
function addToCart(id, name, price) {
    // ตรวจสอบว่าสินค้าอยู่ในรถเข็นแล้วหรือไม่
    const existingItem = cartItems.find(item => item.id === id);

    if (existingItem) {
        // หากมีอยู่แล้ว เพิ่มจำนวน
        existingItem.quantity += 1;
    } else {
        // หากยังไม่มี เพิ่มสินค้าใหม่
        cartItems.push({ id, name, price, quantity: 1, is_done: true });
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
    var locationOrder = $("input[name='locationRadioOptions']:checked").val();

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
    // แปลงเวลาให้อยู่ในรูปแบบ HH:mm:ss
    const orderTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    //Send to kitchen
    const orderData = {
        customerName: customerName,
        items: cartItems,
        locationOrder: locationOrder,
        discharge: true,
        finishedOrder: true,
        orderDate: orderDate,
        orderTime: orderTime,
        dischargeTime : '',
        finishedOrderTime :'',
        remark : ''
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