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
    // $("#editMenuList").on("click", ".btn-edit-item", function () {
    //     // ดึงข้อมูลจาก data-* attributes
    //     const id = $(this).data("id");
    //     const name = $(this).data("name");
    //     const price = $(this).data("price");
    //     const cost = $(this).data("cost");
    //     const category = $(this).data("category");
    //     const active = $(this).data("active"); // Boolean ค่า
    //     const addTopping = $(this).data("addtopping"); // Boolean ค่า
    //     // const imgPath = $(this).data("imgpath");

    //     // เติมข้อมูลใน modal
    //     $("#editMenuName").val(name);
    //     $("#editMenuPrice").val(price);
    //     $("#editMenuCost").val(cost);
    //     $("#editMenuCategory").val(category);
    //     $("#editMenuActive").val(active.toString()); // แปลง Boolean เป็น String
    //     $("#editMenuAddTopping").val(addTopping.toString()); // แปลง Boolean เป็น String

    //     // เก็บ id ไว้ใน data attribute ของ form สำหรับใช้งานในภายหลัง
    //     $("#editMenuForm").data("id", id);

    //     // เปิด modal
    //     $("#staticBackdrop").modal("show");
    // });

    // // เมื่อกด "ยืนยันการแก้ไข"
    // $("#editMenuSubmit").on("click", async function (e) {
    //     e.preventDefault(); // ป้องกันการ submit แบบปกติ

    //     // ดึงข้อมูลจากฟอร์ม
    //     const menuId = $("#editMenuForm").data("id");
    //     const name = $("#editMenuName").val();
    //     const price = $("#editMenuPrice").val();
    //     const cost = $("#editMenuCost").val();
    //     const category = $("#editMenuCategory").val();
    //     const active = $("#editMenuActive").val() === "true"; // แปลงจาก string เป็น Boolean
    //     const addTopping = $("#editMenuAddTopping").val() === "true"; // แปลงจาก string เป็น Boolean
    //     try {
    //         const menuRef = doc(db, "menu", menuId);  // ใช้ document reference ตาม id ที่เก็บไว้
    //         const stockData = {
    //             name,
    //             price: parseFloat(price),
    //             cost: parseFloat(cost),
    //             category,
    //             active,
    //             addTopping
    //             // imgPath // เก็บแค่ path ของรูปภาพ
    //         };

    //         await updateDoc(menuRef, stockData); // อัปเดตข้อมูลใน Firestore

    //         // ปิด modal หลังจากอัปเดต
    //         $("#staticBackdrop").modal("hide");

    //         Swal.fire({
    //             title: "บันทึกสำเร็จ !",
    //             icon: "success"
    //         }).then(() => {
    //             // รีเฟรชข้อมูลเมนู
    //             getMenu(); // ฟังก์ชันดึงข้อมูลเมนูจาก Firestore ใหม่
    //         });

    //     } catch (error) {
    //         console.error("Error updating document: ", error);
    //         alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    //     }
    // });

    $("#addMenuSubmit").on("click", async function (e) {
        e.preventDefault(); // ป้องกันการ submit แบบปกติ
    
        // ดึงข้อมูลจากฟอร์ม
        const itemName = $("#addItemName").val();
        const unit = $("#addUnit").val();
        const qtyRequired = $("#addQTY").val();
        const Category = $("#addMenuStockCategory").val();
        const StockPlace = $("#addMenuStockPlace").val();
        const qtyCurrent = 0
        const qtyNeed = 0
        // ตรวจสอบความสมบูรณ์ของข้อมูล
        if (!itemName || !unit || !qtyRequired || !Category|| !StockPlace) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
    
        // เพิ่มข้อมูลใน Firestore
        try {
            const stockData = {
              itemName,
              qtyRequired :parseFloat(qtyRequired),
              unit,
              Category,
              StockPlace,
              qtyCurrent,
              qtyNeed
            };
    
            // เพิ่มเอกสารใหม่ใน collection "menu"
            await addDoc(collection(db, "stock"), stockData); 
    
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
    const menuCollection = collection(db, "stock");
    const menuSnapshot = await getDocs(menuCollection);

    // ดึงข้อมูลพร้อม document ID
    const menuList = menuSnapshot.docs.map(doc => ({
        id: doc.id, // ดึง document ID
        ...doc.data() // ดึงข้อมูลในเอกสาร
    }));

    // เรียงลำดับเมนูตามตัวแปล name (เรียงตามตัวอักษร)
    menuList.sort((a, b) => a.itemName.localeCompare(b.itemName));
    displayMenu(menuList); // ส่งข้อมูลไปแสดงผล
}

function displayMenu(stockData) {
  // กำหนด container หลัก
  const allMenuContainer = document.getElementById("editMenuList");

  // ล้างข้อมูลเก่า
  allMenuContainer.innerHTML = "";

  // จัดกลุ่มสินค้าโดยใช้ stockplace เป็น key
  const groupedStock = {};
  stockData.forEach(item => {
      if (!groupedStock[item.StockPlace]) {
          groupedStock[item.StockPlace] = [];
      }
      groupedStock[item.StockPlace].push(item);
  });

  // วนลูปสร้างรายการแยกตาม stockplace
  Object.keys(groupedStock).forEach(StockPlace => {
      // หัวข้อหมวดหมู่
    //   var StockName
    //   switch(StockPlace){
    //     case "1": StockName = "เนื้อสัตว์/ของสด" 
    //         break;
    //     case "2": StockName = "เส้น/ข้าว/แป้ง";
    //         break;
    //     case "3": StockName = "ชีส/ไข่ปลา/ไข่หวาน/ครีม";
    //         break;
    //     case "4": StockName = "เนย/แยม/ไอศครีม";
    //         break;
    //     case "5": StockName = "ผัก/ผลไม้/สมุนไพร";
    //     break;
    //     case "6": StockName = "ของทอด/น้ำมัน";
    //         break;
    //     case "7": StockName = "ขนม/ของกินเล่น";
    //         break;
    //     case "8": StockName = "เครื่องปรุง";
    //         break;
    // }
    var StockName
    switch(StockPlace){
      case "1": StockName = "โซนครัว" 
          break;
      case "2": StockName = "โซนเคาเตอร์";
          break;
      case "3": StockName = "โซนตู้เย็น";
          break;
      case "4": StockName = "โซนซิ้งล้างจาน";
          break;
  }
      const categoryHeader = document.createElement("h5");
      categoryHeader.className = "mt-3";
      categoryHeader.textContent = "หมวด " + StockName;

      // สร้างตาราง
      const table = document.createElement("table");
      table.className = "table table-bordered";

      // หัวตาราง
      table.innerHTML = `
          <thead class="table-dark">
              <tr>
                  <th>ชื่อสินค้า</th>
                  <th class="text-center">จำนวนที่ต้องใช้</th>
                  <th class="text-center">จำนวนคงเหลือ</th>
                  <th class="text-center">จำนวนสั่งซื้อเพิ่ม</th>
                  <th class="text-center">บันทึก</th>
              </tr>
          </thead>
          <tbody></tbody>
      `;

      const tbody = table.querySelector("tbody");

      // เพิ่มสินค้าแต่ละรายการเข้าไป
      groupedStock[StockPlace].forEach(item => {
          const row = document.createElement("tr");

          row.innerHTML = `
              <td>${item.itemName}</td>
              <td class="">
                <div class="d-inline-flex align-items-center">
                    <input type="number" class="form-control text-center qty-input" 
                        value="${item.qtyRequired}" 
                        data-id="${item.id}" 
                        style="width: 80px; display: inline-block;" min="0">
                    <span class="ms-2">${item.unit}</span>
                </div>
            </td>
            <td class="">
            <div class="d-inline-flex align-items-center">
                <input type="number" class="form-control text-center qty-input" 
                    value="${item.qtyCurrent}" 
                    data-id="${item.id}" 
                    style="width: 80px; display: inline-block;" min="0">
                <span class="ms-2">${item.unit}</span>
            </div>
        </td>
        <td class="">
        <div class="d-inline-flex align-items-center">
            <input type="number" class="form-control text-center qty-input" 
                value="${item.qtyNeed}" 
                data-id="${item.id}" 
                style="width: 80px; display: inline-block;" min="0">
            <span class="ms-2">${item.unit}</span>
        </div>
    </td>
              <td class="text-center">
                  <button type="button" class="btn btn-primary btn-save-order" 
                      data-id="${item.id}" 
                      data-name="${item.itemName}">
                      บันทึก
                  </button>
              </td>
          `;

          tbody.appendChild(row);
      });

      // เพิ่มหมวดหมู่และตารางสินค้าใน container หลัก
      allMenuContainer.appendChild(categoryHeader);
      allMenuContainer.appendChild(table);
  });

  // Event listener สำหรับปุ่ม "สั่งซื้อเพิ่ม"
  document.querySelectorAll(".btn-save-order").forEach(button => {
      button.addEventListener("click", function() {
          const itemId = this.dataset.id;
          const itemName = this.dataset.name;

          // เปิด modal และส่งค่าข้อมูลสินค้าไปแสดง
          showOrderModal(itemId, itemName);
      });
  });

  // Event listener สำหรับการแก้ไขจำนวนคงเหลือ
  document.querySelectorAll(".qty-input").forEach(input => {
      input.addEventListener("change", function() {
          const itemId = this.dataset.id;
          const newQty = this.value;

          // อัปเดตจำนวนในฐานข้อมูล
          updateStockQuantity(itemId, newQty);
      });
  });
}


// ฟังก์ชันอัปเดตจำนวนคงเหลือ
function updateStockQuantity(itemId, newQty) {
    console.log(`อัปเดตสินค้า ID: ${itemId}, จำนวนใหม่: ${newQty}`);
    // ที่นี่สามารถเพิ่มโค้ดเพื่ออัปเดต Firestore หรือฐานข้อมูลที่ใช้งาน
}

// ฟังก์ชันสั่งซื้อสินค้า
function placeOrder(itemId, orderQty) {
    console.log(`สั่งซื้อสินค้า ID: ${itemId}, จำนวน: ${orderQty}`);
    // ที่นี่สามารถเพิ่มโค้ดเพื่อบันทึกคำสั่งซื้อในฐานข้อมูล
}


