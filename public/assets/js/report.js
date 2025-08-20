// Import the necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  deleteDoc,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

$(document).ready(function () {
  const today = new Date().toISOString().split("T")[0];
  // ตั้งค่า value ของ input ด้วย jQuery
  $("#dateInput").val(today);

  const reportTable = $("#reportTable").DataTable({
    dom: "Bfrtip",
    buttons: [
      {
        extend: "excel",
        text: "Export to Excel",
        title: function () {
          const selectedDate = $("#dateInput").val();
          const selectedType = $("#orderType").val();
          if (selectedType === "grab") {
            return "รายงานการขาย_Grab_วันที่_" + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อไฟล์
          } else {
            return "รายงานการขายวันที่_" + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อไฟล์
          }
        },
      },
      {
        extend: "print",
        text: "Print Report",
        title: function () {
          const selectedDate = $("#dateInput").val();
          const selectedType = $("#orderType").val();
          if (selectedType === "grab") {
            return "รายงานการขาย_Grab_วันที่_" + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อเอกสารที่พิมพ์
          } else {
            return "รายงานการขายวันที่_" + selectedDate; // ใช้ชื่อวันที่ในการตั้งชื่อเอกสารที่พิมพ์
          }
        },
      },
    ],
  });

  $("#fetchDataBtn").on("click", async function () {
    const selectedDate = $("#dateInput").val();
    const selectedType = $("#orderType").val();
    if (!selectedDate) {
      alert("กรุณาเลือกวันที่");
      return;
    }

    const originalButtonHTML = $("#fetchDataBtn").html(); // เก็บ HTML เดิมของปุ่ม
    $("#fetchDataBtn").prop("disabled", true).html(`
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
           <span role="status">Loading...</span>
        `); // เปลี่ยนปุ่มเป็น Loading

    try {
      let ordersQuery = null;
      // Query orders collection
      ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", "==", selectedDate)
      );

      const ordersSnapshot = await getDocs(ordersQuery);

      let filteredOrders = []; // Declare the variable outside of the if-else block

      if (selectedType === "grab") {
        filteredOrders = ordersSnapshot.docs.filter((orderDoc) => {
          const orderData = orderDoc.data();
          return orderData.locationOrder === "Grab"; // Include only "Grab" orders
        });
      } else {
        filteredOrders = ordersSnapshot.docs.filter((orderDoc) => {
          const orderData = orderDoc.data();
          return orderData.locationOrder !== "Grab"; // Exclude "Grab" orders
        });
      }

      const rows = [];
      let totalSalePrice = 0;
      let totalSalePricePromptpay = 0;
      let totalSalePriceCash = 0;
      let totalCost = 0;
      let totalProfit = 0;

      for (const orderDoc of filteredOrders) {
        const order = orderDoc.data();

        for (const item of order.items) {
          // แยก item.id เมื่อมีเครื่องหมาย +
          const itemIds = item.id.split("+"); // แยก id ที่มี + ออกเป็นหลายๆ id

          // ทำงานทีละรายการ
          for (const id of itemIds) {
            // Query the menu document
            const menuDocRef = doc(db, "menu", id.trim()); // แทรก id ที่แยกแล้วไปใช้
            const menuDoc = await getDoc(menuDocRef);

            if (menuDoc.exists()) {
              const menuData = menuDoc.data();

              const cost = menuData.cost * item.quantity;
              const profit = menuData.price * item.quantity - cost;
              const salePrice = menuData.price * item.quantity;

              // Add to the totals
              totalSalePrice += salePrice;
              (totalSalePricePromptpay +=
                order.dischargeType == "Promptpay" ? salePrice : 0),
                (totalSalePriceCash +=
                  order.dischargeType == "Cash" ? salePrice : 0),
                (totalCost += cost);
              totalProfit += profit;

              // Push individual row data
              rows.push([
                menuData.name,
                order.customerName,
                order.orderTime,
                order.finishedOrderTime,
                order.dischargeTime,
                order.locationOrder == "forHere" ? "ทานที่ร้าน" : "กลับบ้าน",
                salePrice,
                order.dischargeType == "Promptpay" ? salePrice : 0,
                order.dischargeType == "Cash" ? salePrice : 0,
                menuData.price,
                item.quantity,
                cost,
                menuData.cost,
                profit,
              ]);
            } else {
              console.error(`Menu item not found: ${id}`);
            }
          }
        }
      }

      // Add the total row with the "total-row" class for green background
      rows.push([
        "Total", // Item name is "Total"
        "",
        "",
        "",
        "",
        "",
        '<p class="fs-5 fw-bold">' + totalSalePrice + "</p>",
        totalSalePricePromptpay,
        totalSalePriceCash,
        "", // No need for individual price
        "", // No need for individual quantity
        totalCost,
        "", // No need for individual unit cost
        '<p class="fs-5 fw-bold">' + totalProfit + "</p>",
      ]);

      // Update the DataTable
      reportTable.clear();
      reportTable.rows.add(rows);
      reportTable.draw();
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      $("#fetchDataBtn").prop("disabled", false).html(originalButtonHTML); // คืนปุ่มกลับสู่สถานะเดิม
    }
  });

  $("#btn_insertDataToChickkoDB").on("click", async function () {
    $("#loginApiModel").modal("show");
  });

  $("#btn_loginApi").on("click", async function (e) {
    const username = $("#username").val();
    const password = $("#password").val();
      const originalButtonHTML = $("#btn_loginApi").html(); // เก็บ HTML เดิมของปุ่ม
    $("#btn_loginApi").prop("disabled", true).html(`
              <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
           <span role="status">Loading...</span>
        `); // เปลี่ยนปุ่มเป็น Loading
    try {
      //get token from https://chickkoapi.up.railway.app/api/auth/login
      const URLAPI = "https://chickkoapi.up.railway.app/api/auth/login";
      //const URLAPI  = "http://localhost:5036/api/auth/login"
      const response = await fetch(URLAPI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        alert(
          `❌ ล็อกอินไม่สำเร็จ: ${response.status} ${response.statusText}\n${errText}`
        );
        return;
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        alert("❌ ไม่สามารถเข้าสู่ระบบได้ (ไม่มี token)");
        return;
      }

      console.log("✅ ล็อกอินสำเร็จ");
      await updateChickkoDB(token); // ฟังก์ชันที่คุณเรียกต่อ
      $("#btn_loginApi").prop("disabled", false).html(originalButtonHTML); // คืนปุ่มกลับสู่สถานะเดิม
    } catch (err) {
      console.log("เกิดข้อผิดพลาด: " + err.message);
      console.error(err);
    }
  });
});

async function updateChickkoDB(token) {
  try {
    const selectedDate = $("#dateInput").val();
    if (!selectedDate) {
      alert("กรุณาเลือกวันที่");
      return;
    }
    //call api http://localhost:5036/api/orders/CopyOrderFromFirestore with token and data OrderDateFrom
    //const URLAPI = "http://localhost:5036/api/orders/CopyOrderFromFirestore"
    const URLAPI =
      "https://chickkoapi.up.railway.app/api/orders/CopyOrderFromFirestore";
    const apiResponse = await fetch(URLAPI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        OrderDateFrom: selectedDate,
        OrderDateTo: selectedDate,
      }),
    });

    // 🔴 ตรวจสอบว่าตอบกลับ OK ก่อนค่อยอ่าน .json()
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text(); // อ่านเป็น text เพื่อดูข้อความ error
      alert(`❌ เรียก API ล้มเหลว: ${apiResponse.status}\n${errorText}`);
      return;
    }

    // ✅ อ่าน JSON ได้แค่ครั้งเดียวตรงนี้
    const apiData = await apiResponse.json();

    if (apiData.success) {
      alert("✅ บันทึกข้อมูลสำเร็จ: " + apiData.message);
    } else {
      alert("❌ เกิดข้อผิดพลาด: " + apiData.message);
    }
  } catch (err) {
    console.log("เกิดข้อผิดพลาด: " + err.message);
    console.error(err);
  }
}
