// Import the necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js"; // แก้ไขจากการนำเข้าผิดที่

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
// const firebaseConfig = {
//   apiKey: "AIzaSyCDzE1eNH7x-4vYR4-bdKsV13E30x-5BsQ",
//   authDomain: "chick-ko-bkk.firebaseapp.com",
//   projectId: "chick-ko-bkk",
//   storageBucket: "chick-ko-bkk.firebasestorage.app",
//   messagingSenderId: "581157913930",
//   appId: "1:581157913930:web:90365f413c1ab884612db3"
// };
// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const storage = getStorage(app); // กำหนด storage ตัวนี้สำหรับใช้งาน Firebase Storage
// const analytics = getAnalytics(app);
const cartItems = [];
const cartList = document.getElementById("cartItems");
const totalDisplay = document.getElementById("total");
const cardQTY = document.getElementById("cardQTY");


// Fetch the menu when the page loads
window.onload = getMenu;

$(document).ready(function () { 
    $("#editMenuList, #editMenufriedChickenList, #editMenuMealList, #editMenuNoodleList, #editMenuSnackList, #editMenuToppingList, #editMenuDessertList, #editMenuBeverageList").on("click", ".btn-edit-item", function () {
        // ดึงข้อมูลจาก data-* attributes
        const id = $(this).data("id");
        const name = $(this).data("name");
        const price = $(this).data("price");
        const cost = $(this).data("cost");
        const category = $(this).data("category");
        const active = $(this).data("active"); // Boolean ค่า
        const addTopping = $(this).data("addtopping"); // Boolean ค่า
        // const imgPath = $(this).data("imgpath");

        // เติมข้อมูลใน modal
        $("#editMenuName").val(name);
        $("#editMenuPrice").val(price);
        $("#editMenuCost").val(cost);
        $("#editMenuCategory").val(category);
        $("#editMenuActive").val(active.toString()); // แปลง Boolean เป็น String
        $("#editMenuAddTopping").val(addTopping.toString()); // แปลง Boolean เป็น String

        // เก็บ id ไว้ใน data attribute ของ form สำหรับใช้งานในภายหลัง
        $("#editMenuForm").data("id", id);

        // เปิด modal
        $("#staticBackdrop").modal("show");
    });

    // เมื่อกด "ยืนยันการแก้ไข"
    $("#editMenuSubmit").on("click", async function (e) {
        e.preventDefault(); // ป้องกันการ submit แบบปกติ

        // ดึงข้อมูลจากฟอร์ม
        const menuId = $("#editMenuForm").data("id");
        const name = $("#editMenuName").val();
        const price = $("#editMenuPrice").val();
        const cost = $("#editMenuCost").val();
        const category = $("#editMenuCategory").val();
        const active = $("#editMenuActive").val() === "true"; // แปลงจาก string เป็น Boolean
        const addTopping = $("#editMenuAddTopping").val() === "true"; // แปลงจาก string เป็น Boolean
        try {
            const menuRef = doc(db, "menu", menuId);  // ใช้ document reference ตาม id ที่เก็บไว้
            const menuData = {
                name,
                price: parseFloat(price),
                cost: parseFloat(cost),
                category,
                active,
                addTopping
                // imgPath // เก็บแค่ path ของรูปภาพ
            };

            await updateDoc(menuRef, menuData); // อัปเดตข้อมูลใน Firestore

            // ปิด modal หลังจากอัปเดต
            $("#staticBackdrop").modal("hide");

            Swal.fire({
                title: "บันทึกสำเร็จ !",
                icon: "success"
            }).then(() => {
                // รีเฟรชข้อมูลเมนู
                getMenu(); // ฟังก์ชันดึงข้อมูลเมนูจาก Firestore ใหม่
            });

        } catch (error) {
            console.error("Error updating document: ", error);
            alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        }
    });

    $("#addMenuSubmit").on("click", async function (e) {
        e.preventDefault(); // ป้องกันการ submit แบบปกติ
    
        // ดึงข้อมูลจากฟอร์ม
        const name = $("#addMenuName").val();
        const price = $("#addMenuPrice").val();
        const cost = $("#addMenuCost").val();
        const category = $("#addMenuCategory").val();
        const active = $("#editMenuActive").val() === "true";
        const addTopping = $("#editMenuAddTopping").val() === "true";
        const imgPath ="";
    
        // ตรวจสอบความสมบูรณ์ของข้อมูล
        if (!name || !price || !cost || !category) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
    
        // เพิ่มข้อมูลใน Firestore
        try {
            const menuData = {
                name,
                price: parseFloat(price),
                cost: parseFloat(cost),
                category,
                active,
                imgPath,
                addTopping
            };
    
            // เพิ่มเอกสารใหม่ใน collection "menu"
            await addDoc(collection(db, "menu"), menuData); 
    
            // ปิด modal หลังจากเพิ่ม
            $("#addNewMenu").modal("hide");
    
            // รีเฟรชข้อมูลเมนู
            Swal.fire({
                title: "บันทึกสำเร็จ !",
                icon: "success"
            }).then(() => {
                // รีเฟรชข้อมูลเมนู
                getMenu(); // ฟังก์ชันดึงข้อมูลเมนูจาก Firestore ใหม่
            });

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มเมนู");
        }
    });
    
});


// Fetch menu data from Firestore
async function getMenu() {
    const menuCollection = collection(db, "menu");
    const menuSnapshot = await getDocs(menuCollection);

    // ดึงข้อมูลพร้อม document ID
    const menuList = menuSnapshot.docs.map(doc => ({
        id: doc.id, // ดึง document ID
        ...doc.data() // ดึงข้อมูลในเอกสาร
    }));

    // เรียงลำดับเมนูตามตัวแปล name (เรียงตามตัวอักษร)
    menuList.sort((a, b) => a.name.localeCompare(b.name));
    displayMenu(menuList); // ส่งข้อมูลไปแสดงผล
}

// Display the menu on the page
function displayMenu(menuData) {
    // กำหนด container สำหรับทุกหมวดหมู่
    const allMenuContainer = document.getElementById("editMenuList");
    const menufriedChickenContainer = document.getElementById("editMenufriedChickenList");
    const menuMealContainer = document.getElementById("editMenuMealList");
    const menuNoodleContainer = document.getElementById("editMenuNoodleList");
    const menuSnackContainer = document.getElementById("editMenuSnackList");
    const menuToppingContainer = document.getElementById("editMenuToppingList");
    const menuDessertContainer = document.getElementById("editMenuDessertList");
    const menuBeverageContainer = document.getElementById("editMenuBeverageList");

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
              <button type="button" class="btn btn-outline-dark btn-edit-item" 
                      data-id="${item.id}" 
                      data-name="${item.name}"
                      data-price="${item.price}"
                      data-cost="${item.cost}"
                      data-category="${item.category}"
                      data-active="${item.active}"
                      data-addTopping="${item.addTopping}"
                      data-imgpath="${imgMenu}">
                แก้ไข
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
