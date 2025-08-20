// Import the necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

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

const cartItems = [];
const cartToppingItems = [];
const cartList = document.getElementById("cartItems");
const cartToppingList = document.getElementById("cartToppingItems");
const totalDisplay = document.getElementById("total");
const totalToppingDisplay = document.getElementById("totalTopping");
let currentOrderCache = [];
let userIsInteracting = false;

window.onload = getCurrentOrder;

$(document).ready(function () {
    // ดึงออเดอร์เมื่อโหลดหน้า
    getCurrentOrder();
    // ตรวจสอบว่า Firebase SDK ถูกนำเข้าไว้แล้ว

    $("#currentOrderPanels").on("click", ".btn-update-finishedOrder", async function () {
        const id = $(this).data("id");  // ดึง id ของออเดอร์จาก data-id ของปุ่ม

        if (!id) {
            Swal.fire({
                title: "ข้อผิดพลาด",
                text: "ไม่พบข้อมูลคำสั่งซื้อ",
                icon: "error",
            });
            return;
        }

        try {

            const now = new Date();
            // แปลงเวลาให้อยู่ในรูปแบบ HH:mm:ss
            const finishedOrderTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

            // Reference the Firestore document
            const orderDocRef = doc(db, "orders", id);

            // Update the finishedOrder field to true
            await updateDoc(orderDocRef, { finishedOrder: true, finishedOrderTime: finishedOrderTime });

            // Show success message
            Swal.fire({
                title: "สำเร็จ!",
                text: `อัปเดต finishedOrder เรียบร้อยแล้ว`,
                icon: "success",
                timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                // โหลดข้อมูลใหม่หลังจากอัปเดต
                getCurrentOrder();  // ฟังก์ชันที่โหลดรายการคำสั่งซื้อใหม่
            });
        } catch (error) {
            console.error("Error updating finishedOrder: ", error);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: `ไม่สามารถอัปเดต finishedOrder สำหรับคำสั่งซื้อ ID: ${id}`,
                icon: "error",
            });
        }
    });
    $("#currentOrderPanels").on("click", ".btn-update-delete", async function () {


        const result = await Swal.fire({
            title: "ยืนยันการลบ order?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",

            confirmButtonText: "ยืนยันลบ",
            cancelButtonText: "ยกเลิก",
        });

        if (result.isConfirmed) {
            // อ้างอิง id จาก modal หรือปุ่ม
            try {
                const id = $(this).data("id");  // ดึง id ของออเดอร์จาก data-id ของปุ่ม

                if (!id) {
                    Swal.fire({
                        title: "ข้อผิดพลาด",
                        text: "ไม่พบข้อมูลคำสั่งซื้อ",
                        icon: "error",
                    });
                    return;
                }

                // อัปเดตฟิลด์ discharge ใน Firestore
                const orderDocRef = doc(db, "orders", id);
                // ลบเอกสาร
                await deleteDoc(orderDocRef);

                // แจ้งเตือนสำเร็จ
                Swal.fire({
                    title: "ลบข้อมูลสำเร็จ!",
                    icon: "success",
                    timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                    timerProgressBar: true,
                    showConfirmButton: false
                }).then(() => {
                    // ปิด modal
                    // โหลดข้อมูลใหม่
                    getCurrentOrder();
                });

            } catch (error) {
                console.error("Error updating discharge: ", error);

                // แจ้งเตือนข้อผิดพลาด
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: "ไม่สามารถอัปเดตสถานะจ่ายเงินได้",
                    icon: "error",
                });
            }
        }
    });
    $("#currentOrderPanels").on("click", ".btn-update-grab-discharge", async function () {
        const id = $(this).data("id");  // ดึง id ของออเดอร์จาก data-id ของปุ่ม

        if (!id) {
            Swal.fire({
                title: "ข้อผิดพลาด",
                text: "ไม่พบข้อมูลคำสั่งซื้อ",
                icon: "error",
            });
            return;
        }

        try {

            const now = new Date();
            // แปลงเวลาให้อยู่ในรูปแบบ HH:mm:ss
            const grabDischargeTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

            // Reference the Firestore document
            const orderDocRef = doc(db, "orders", id);

            // Update the finishedOrder field to true
            await updateDoc(orderDocRef, { discharge: true, dischargeTime: grabDischargeTime, dischargeType: 'Grab', });

            // Show success message
            Swal.fire({
                title: "สำเร็จ!",
                text: `อัปเดต ส่งแกรป เรียบร้อยแล้ว`,
                icon: "success",
                timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                // โหลดข้อมูลใหม่หลังจากอัปเดต
                getCurrentOrder();  // ฟังก์ชันที่โหลดรายการคำสั่งซื้อใหม่
            });
        } catch (error) {
            console.error("Error updating finishedOrder: ", error);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: `ไม่สามารถอัปเดต ส่งแกรป สำหรับคำสั่งซื้อ ID: ${id}`,
                icon: "error",
            });
        }
    });
    $("#currentOrderPanels").on("click", ".btn-update-discharge", function () {
        const id = $(this).data("id");
        const customerName = $(this).data("customer");
        const items = $(this).data("items");

        // แสดง modal
        const modal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
        modal.show();

        // กรอกข้อมูลลงใน modal
        $("#customerName").val(customerName);
        // เพิ่ม id ให้ปุ่มยืนยัน
        $("#dischargeSubmit").data("id", id); // เพิ่ม data-id
        $("#dischargeChangeSubmit").data("id", id); // เพิ่ม data-id

        const orderItemsContainer = $("#orderItems");
        orderItemsContainer.empty(); // ล้างข้อมูลเก่า

        let total = 0;
        let nonDischargetotal = 0;
        items.forEach(item => {
            // ตรวจสอบข้อมูลก่อนใช้งาน
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity, 10) || 0;

            // คำนวณยอดรวม
            const subtotal = price * quantity;

            const priceContent = item.itemDischarge
                ? `<div class="price-wrapper">
                  <span class="price-text">${subtotal.toFixed(2)} THB</span>
                  <img src="assets/img/paid-stamp-icon.png" alt="Paid" class="paid-stamp" alt="Paid" width="auto" height="50">
               </div>`
                : `${subtotal.toFixed(2)} THB`;

            // สร้างรายการแสดงผล
            const itemElement = `
                <li class="list-group-item d-flex justify-content-between">
                    <span>${item.name} <strong>x ${quantity}</strong></span>
                    <span>${priceContent} </span>
                </li>
            `;
            orderItemsContainer.append(itemElement);
            total += subtotal;
            if (item.itemDischarge == false) {
                nonDischargetotal += subtotal;
            }
        });

        // แสดงยอดรวมทั้งหมด
        if (total != nonDischargetotal) {
            $("#total").text(`ยอดรวม: ${nonDischargetotal.toFixed(2)} THB  (จาก ${total.toFixed(2)}) THB`);
        }
        else {
            $("#total").text(`ยอดรวม: ${total.toFixed(2)} THB`);
        }

        $("#totalWithDiscount").text('');
    });

    $("#dischargeSubmit ,#dischargeChangeSubmit").on("click", async function () {
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
        // อ้างอิง id จาก modal หรือปุ่ม
        const id = $("#dischargeSubmit").data("id");
        const now = new Date();
        // แปลงเวลาให้อยู่ในรูปแบบ HH:mm:ss
        const dischargeTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

        if (result.isConfirmed) {

            try {
                // อัปเดตฟิลด์ discharge ใน Firestore
                const orderDocRef = doc(db, "orders", id);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    let orderData = orderDocSnap.data();
                    let updatedItems = orderData.items.map(item => ({
                        ...item,
                        itemDischarge: true
                    }));
                    //                 await updateDoc(orderDocRef, { discharge: true, dischargeTime: dischargeTime, dischargeType: 'Promptpay' });
                    await updateDoc(orderDocRef, {
                        discharge: true,
                        dischargeTime: dischargeTime,
                        dischargeType: 'Promptpay',
                        items: updatedItems // อัปเดต items ใหม่
                    });


                    // แจ้งเตือนสำเร็จ
                    Swal.fire({
                        title: "สำเร็จ!",
                        text: "อัปเดตสถานะจ่ายเงินเรียบร้อยแล้ว",
                        icon: "success",
                        timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                        timerProgressBar: true,
                        showConfirmButton: false
                    }).then(() => {
                        // ปิด modal
                        const modalElement = document.getElementById("staticBackdrop");
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        modalInstance.hide();

                        const modalElement2 = document.getElementById("changeModal");
                        const modalInstance2 = bootstrap.Modal.getInstance(modalElement2);
                        if (modalInstance2) {
                            modalInstance2.hide();
                        }


                        // โหลดข้อมูลใหม่
                        getCurrentOrder();
                    });

                } else {
                    Swal.fire("ผิดพลาด", "ไม่พบข้อมูลออเดอร์", "error");
                }
            } catch (error) {
                console.error("Error updating discharge: ", error);

                // แจ้งเตือนข้อผิดพลาด
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: "ไม่สามารถอัปเดตสถานะจ่ายเงินได้",
                    icon: "error",
                });
            }
        }
        else if (result.isDenied) {
            try {
                // อัปเดตฟิลด์ discharge ใน Firestore
                const orderDocRef = doc(db, "orders", id);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    let orderData = orderDocSnap.data();
                    let updatedItems = orderData.items.map(item => ({
                        ...item,
                        itemDischarge: true
                    }));
                    //                 await updateDoc(orderDocRef, { discharge: true, dischargeTime: dischargeTime, dischargeType: 'Promptpay' });
                    await updateDoc(orderDocRef, {
                        discharge: true,
                        dischargeTime: dischargeTime,
                        dischargeType: 'Cash',
                        items: updatedItems // อัปเดต items ใหม่
                    });


                    // แจ้งเตือนสำเร็จ
                    Swal.fire({
                        title: "สำเร็จ!",
                        text: "อัปเดตสถานะจ่ายเงินเรียบร้อยแล้ว",
                        icon: "success",
                        timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                        timerProgressBar: true,
                        showConfirmButton: false
                    }).then(() => {
                        // ปิด modal
                        const modalElement = document.getElementById("staticBackdrop");
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        modalInstance.hide();

                        const modalElement2 = document.getElementById("changeModal");
                        const modalInstance2 = bootstrap.Modal.getInstance(modalElement2);
                        if (modalInstance2) {
                            modalInstance2.hide();
                        }


                        // โหลดข้อมูลใหม่
                        getCurrentOrder();
                    });

                } else {
                    Swal.fire("ผิดพลาด", "ไม่พบข้อมูลออเดอร์", "error");
                }
            } catch (error) {
                console.error("Error updating discharge: ", error);

                // แจ้งเตือนข้อผิดพลาด
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: "ไม่สามารถอัปเดตสถานะจ่ายเงินได้",
                    icon: "error",
                });
            }
        }
    });

    // $("#dischargeChangeSubmit").on("click", async function () {
    //     // แสดง Swal เพื่อยืนยันการจ่ายเงิน
    //     const result = await Swal.fire({
    //         title: "ยืนยันการจ่ายเงิน?",
    //         text: "คุณต้องการยืนยันการจ่ายเงินสำหรับออเดอร์นี้หรือไม่?",
    //         icon: "warning",
    //         showCancelButton: true,
    //         confirmButtonColor: "#3085d6",
    //         cancelButtonColor: "#d33",
    //         confirmButtonText: "ยืนยัน",
    //         cancelButtonText: "ยกเลิก",
    //     });

    //     if (result.isConfirmed) {
    //         // อ้างอิง id จาก modal หรือปุ่ม
    //         const id = $("#dischargeSubmit").data("id");
    //         const now = new Date();
    //         // แปลงเวลาให้อยู่ในรูปแบบ HH:mm:ss
    //         const dischargeTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    //         try {
    //             // อัปเดตฟิลด์ discharge ใน Firestore
    //             const orderDocRef = doc(db, "orders", id);
    //             await updateDoc(orderDocRef, { discharge: true, dischargeTime: dischargeTime });

    //             // แจ้งเตือนสำเร็จ
    //             Swal.fire({
    //                 title: "สำเร็จ!",
    //                 text: "อัปเดตสถานะจ่ายเงินเรียบร้อยแล้ว",
    //                 icon: "success",
    //                 timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
    //                 timerProgressBar: true,
    //                 showConfirmButton: false
    //             }).then(() => {
    //                 // ปิด modal
    //                 const modalElement = document.getElementById("staticBackdrop");
    //                 const modalInstance = bootstrap.Modal.getInstance(modalElement);
    //                 modalInstance.hide();

    //                 const modalElement2 = document.getElementById("changeModal");
    //                 const modalInstance2 = bootstrap.Modal.getInstance(modalElement2);
    //                 modalInstance2.hide();

    //                 // โหลดข้อมูลใหม่
    //                 getCurrentOrder();
    //             });

    //         } catch (error) {
    //             console.error("Error updating discharge: ", error);

    //             // แจ้งเตือนข้อผิดพลาด
    //             Swal.fire({
    //                 title: "เกิดข้อผิดพลาด",
    //                 text: "ไม่สามารถอัปเดตสถานะจ่ายเงินได้",
    //                 icon: "error",
    //             });
    //         }
    //     }
    // });

    //function update check ว่าทำเสร็จแล้ว
    $(document).on("change", ".item-checkbox", async function () {
        const checkbox = $(this);
        const orderId = checkbox.data("id");
        const itemIndex = checkbox.data("index");
        const isChecked = checkbox.is(":checked");

        try {
            const orderDocRef = doc(db, "orders", orderId);
            const orderSnapshot = await getDoc(orderDocRef);

            if (orderSnapshot.exists()) {
                const orderData = orderSnapshot.data();
                const updatedItems = [...orderData.items];
                updatedItems[itemIndex].done = isChecked;

                await updateDoc(orderDocRef, { items: updatedItems });
                console.log(`Updated item ${itemIndex} to done = ${isChecked}`);
            } else {
                console.error("Order not found");
            }
        } catch (error) {
            console.error("Error updating item:", error);
        }
    });

    $("#currentOrderPanels").on("click", ".btn-add-more-order", function () {
        const id = $(this).data("id");
        const customerName = $(this).data("customer");

        // แสดง modal
        const modal = new bootstrap.Modal(document.getElementById("addMenuModal"));
        modal.show();

        // กรอกข้อมูลลงใน modal
        $("#addMenuCustomerName").val(customerName);
        // เพิ่ม id ให้ปุ่มยืนยัน
        $("#addMenuSubmit").data("id", id); // เพิ่ม data-id

        // const orderItemsContainer = $("#orderItems");
        // orderItemsContainer.empty(); // ล้างข้อมูลเก่า

        $('#cartItems').empty();
        cartItems.length = 0;

        getMenu();

    });
    $("#currentOrderPanels").on("click", ".btn-save-remark", async function () {
        const id = $(this).data('id'); // ดึง orderId จาก data-id
        const newRemark = $("#orderRemark-" + id).val(); // ดึงค่าที่เลือกใหม่จาก dropdown
        if (!id) {
            Swal.fire({
                title: "ข้อผิดพลาด",
                text: "ไม่พบข้อมูลคำสั่งซื้อ",
                icon: "error",
            });
            return;
        }

        try {

            // Reference the Firestore document
            const orderDocRef = doc(db, "orders", id);

            // Update the finishedOrder field to true
            await updateDoc(orderDocRef, { remark: newRemark });

            // Show success message
            Swal.fire({
                title: "อัปเดตหมายเหตุสำเร็จ!",
                icon: "success",
                timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                // โหลดข้อมูลใหม่หลังจากอัปเดต
                getCurrentOrder();  // ฟังก์ชันที่โหลดรายการคำสั่งซื้อใหม่
            });
        } catch (error) {
            console.error("Error updating finishedOrder: ", error);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: `ไม่สามารถอัปเดต finishedOrder สำหรับคำสั่งซื้อ ID: ${id}`,
                icon: "error",
            });
        }

    });



    $("#menuList , #menufriedChickenList, #menuMealList, #menuSnackList, #menuToppingList, #menuDessertList, #menuBeverageList").on("click", ".add-to-cart", function () {
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

    $('#addMenuSubmit').on('click', function () {
        const orderId = $(this).data("id"); // ดึง data-id ที่ตั้งไว้ในปุ่ม
        console.log(orderId); // เช็คว่าได้ค่าหรือไม่
        // ตรวจสอบว่ามีสินค้าในรถเข็นหรือไม่
        if (!orderId) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: "ไม่พบข้อมูล ID ของคำสั่ง",
                icon: "warning"
            });
            return;
        }
        Swal.fire({
            title: "ยืนยันการเพิ่มรายการ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#198754",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ปิด",
            allowOutsideClick: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                updateOrderToKitchen(orderId); // ส่ง orderId ไปในฟังก์ชัน
            }
        });
    });

    // ใช้ event delegation สำหรับปุ่มลบรายการ
    // ใช้ event delegation สำหรับปุ่มลบรายการ
    $("#currentOrderPanels").on("click", ".btn-delete-item", function () {
        const orderId = $(this).data("id");
        const itemIndex = $(this).data("index");
        const name = $(this).data("name");
        // แสดง Swal เพื่อถามก่อนลบ
        Swal.fire({
            title: 'ลบ ' + name + ' ออกจากรายการ ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'ยืนยันลบ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                // หากยืนยัน ให้เรียกฟังก์ชันลบ
                deleteItemFromOrder(orderId, itemIndex);

                // // แสดง Swal สำเร็จ
                // Swal.fire(
                //     'ลบเรียบร้อย!',
                //     'รายการได้ถูกลบออกแล้ว.',
                //     'success'
                // );
            }
        });
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


        addToCart(totalID, totalName, totalPrice, addMenuRemark, addMenuQTY);
        $('#addToppingModal').modal('hide'); // เปลี่ยน addMenuModal เป็น ID ของ modal ที่คุณใช้

    });

    $("#currentOrderPanels").on("change", ".table-select", async function () {
        const id = $(this).data('id'); // ดึง orderId จาก data-id
        const newTableNumber = $(this).val(); // ดึงค่าที่เลือกใหม่จาก dropdown
        let locationOrder = "forHere";
        if (!id) {
            Swal.fire({
                title: "ข้อผิดพลาด",
                text: "ไม่พบข้อมูลคำสั่งซื้อ",
                icon: "error",
            });
            return;
        }

        switch (newTableNumber) {
            case "ta": locationOrder = "takeAway"
                break;
            case "grab": locationOrder = "Grab"
                break;
            default: locationOrder = "forHere"
                break;
        }

        try {

            // Reference the Firestore document
            const orderDocRef = doc(db, "orders", id);

            // Update the finishedOrder field to true
            await updateDoc(orderDocRef, { tableNumber: newTableNumber, locationOrder: locationOrder });

            // Show success message
            Swal.fire({
                title: "อัปเดตโต๊ะสำเร็จ!",
                icon: "success",
                timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                // โหลดข้อมูลใหม่หลังจากอัปเดต
                getCurrentOrder();  // ฟังก์ชันที่โหลดรายการคำสั่งซื้อใหม่
            });
        } catch (error) {
            console.error("Error updating finishedOrder: ", error);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: `ไม่สามารถอัปเดต finishedOrder สำหรับคำสั่งซื้อ ID: ${id}`,
                icon: "error",
            });
        }

    });


    $("#calculateChangeBtn").click(function () {
        // เปิด changeModal
        let totalAmount = parseFloat($('#total').text().replace('ยอดรวม: ', '').replace(' THB', ''));
        $('#totalAmount').val(totalAmount.toFixed(2)); // ตั้งค่าราคายอดรวมใน modal
        $('#receivedAmount').val(''); // ล้างช่องกรอกเงินที่รับ
        $('#changeResult').text('เงินทอน: 0.00 THB'); // รีเซ็ตเงินทอน
        $("#changeModal").modal("show");
    });

    // คำนวณเงินทอน
    $('#calculateChange').on('click', function () {
        let received = parseFloat($('#receivedAmount').val());
        let total = parseFloat($('#totalAmount').val());

        if (!isNaN(received) && received >= total) {
            let change = received - total;
            $('#changeResult').text(`เงินทอน: ${change.toFixed(2)} THB`).removeClass('alert-danger').addClass('alert-info');
        } else {
            $('#changeResult').text('กรุณากรอกจำนวนเงินให้ถูกต้อง!').removeClass('alert-info').addClass('alert-danger');
        }
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

    $('#applyDiscountBtn').on('click', function () {
        // สมมุติว่า total อยู่ในรูปแบบ "ยอดรวม: 0.00 THB"
        var totalText = $('#total').text();
        var totalValue = parseFloat(totalText.replace(/[^0-9\.]+/g, ''));

        if (!isNaN(totalValue)) {
            var discounted = totalValue * 0.9;
            // ปัดเศษขึ้นเป็นจำนวนเต็ม
            var discountedRounded = Math.ceil(discounted);
            $('#totalWithDiscount').text('ยอดรวม (ส่วนลด 10%): ' + discountedRounded + ' THB');
            // $('#total').removeClass('fs-3').addClass('fs-6');
        }
    });

    $(document).on('click', function (e) {
        const $target = $(e.target);
    
        if (
            $target.closest('.modal').length > 0 ||
            $target.hasClass('btn-update-discharge') ||
            $target.hasClass('btn-add-more-order') ||
            // $target.closest('button').length > 0 ||
            $target.closest('input').length > 0 ||
            $target.closest('textarea').length > 0
        ) {
            userIsInteracting = true;
    
            // คืนค่าเป็น false อัตโนมัติหลัง 5 วิ
            setTimeout(() => {
                userIsInteracting = false;
            }, 5000);
        }
    });
    
    $(document).on('focusin', 'input, textarea, .modal', () => {
        userIsInteracting = true;
    });
    $(document).on('focusout', 'input, textarea, .modal', () => {
        setTimeout(() => {
            userIsInteracting = false;
        }, 3000); // รอเผื่อว่าผู้ใช้จะคลิกต่อ
    });
    
});
// async function getCurrentOrder() {
//     const now = new Date();
//     const orderDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

//     // สร้าง query เพื่อดึงข้อมูล orders
//     const orderCollectionRef = collection(db, "orders");
//     const ordersQuery = query(orderCollectionRef, where("orderDate", "==", orderDate));

//     try {
//         const orderSnapshot = await getDocs(ordersQuery);
//         const currentOrderList = orderSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         // ดึงสถานะของ accordion ที่เปิดอยู่
//         const openAccordions = {};
//         document.querySelectorAll(".accordion-collapse.show").forEach(item => {
//             openAccordions[item.id] = true;
//         });

//         // แสดงข้อมูล order
//         displayCurrnetOrder(currentOrderList);

//         // คืนค่าการแสดงผล accordion ที่เปิดอยู่
//         Object.keys(openAccordions).forEach(id => {
//             const accordion = document.getElementById(id);
//             if (accordion) {
//                 const bootstrapAccordion = new bootstrap.Collapse(accordion, { toggle: false });
//                 bootstrapAccordion.show();
//             }
//         });
//     } catch (error) {
//         console.error("Error fetching orders: ", error);
//     }
// }


function getCurrentOrder() {
    const now = new Date();
    const orderDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const orderCollectionRef = collection(db, "orders");
    const ordersQuery = query(orderCollectionRef, where("orderDate", "==", orderDate));

    onSnapshot(ordersQuery, (snapshot) => {
        const newOrderList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const isChanged = JSON.stringify(currentOrderCache) !== JSON.stringify(newOrderList);

        if (isChanged) {
            // 🔒 เก็บสถานะ Accordion ที่เปิด
            const openAccordions = {};
            document.querySelectorAll(".accordion-collapse.show").forEach(item => {
                openAccordions[item.id] = true;
            });

            // ✍ เก็บ remark ที่ผู้ใช้พิมพ์
            const remarkInputs = {};
            document.querySelectorAll("textarea[id^='orderRemark-']").forEach(item => {
                remarkInputs[item.id] = item.value;
            });

            // 🔍 ตรวจ modal
            const isModalOpen = document.querySelector('.modal.show') !== null;
            const openModalId = isModalOpen ? document.querySelector('.modal.show').id : null;

            const isUserTyping =
                document.activeElement.tagName === "TEXTAREA" ||
                document.activeElement.tagName === "INPUT";

            if (!isUserTyping && !userIsInteracting) {
                displayCurrnetOrder(newOrderList);

                // 🔄 Restore remark
                Object.entries(remarkInputs).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input) input.value = value;
                });

                // 🔄 Restore accordion
                Object.keys(openAccordions).forEach(id => {
                    const accordion = document.getElementById(id);
                    if (accordion) {
                        const bsAccordion = new bootstrap.Collapse(accordion, { toggle: false });
                        bsAccordion.show();
                    }
                });

                // 🔄 Restore modal ถ้าเปิดอยู่
                if (openModalId) {
                    const modalEl = document.getElementById(openModalId);
                    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modalInstance.show();
                }

                // 🧠 อัปเดต cache
                currentOrderCache = newOrderList;
            } else {
                console.log("🔒 ผู้ใช้กำลังใช้งาน - ไม่รีเฟรช DOM");
            }
        }
    });
}


function displayCurrnetOrder(orderData) {
    const currentOrderContainer = document.getElementById("currentOrderPanels");
    currentOrderContainer.innerHTML = ""; // ล้างข้อมูลเก่า

    const sortedOrders = orderData.sort((a, b) => {
        const timeA = a.orderTime.replace(/:/g, '');
        const timeB = b.orderTime.replace(/:/g, '');
        return timeA - timeB; // เรียงจากเวลาที่เก่าก่อน
    });

    sortedOrders.forEach(item => {
        if (item.discharge === false || item.finishedOrder === false) {
            // กำหนดสีพื้นหลังและข้อความตามสถานะ
            let bgColor = 'bg-success-subtle';
            let locationOrderText = "กลับบ้าน";
            let tableNumberText = "";
            
            if (item.locationOrder === 'forHere') {
                bgColor = 'bg-info-subtle';

                switch (item.tableNumber) {
                    case "t1": tableNumberText = "โต๊ะ 1"
                        break;
                    case "t2": tableNumberText = "โต๊ะ 2"
                        break;
                    case "t3": tableNumberText = "โต๊ะ 3"
                        break;
                    case "t4": tableNumberText = "โต๊ะ 4"
                        break;
                    case "tw": tableNumberText = "รอโต๊ะ"
                        break;
                    default: tableNumberText = "รอโต๊ะ"
                        break;
                }

                locationOrderText = tableNumberText;
            } else if (item.locationOrder === 'takeAway') {
                bgColor = 'bg-success-subtle';
                locationOrderText = "กลับบ้าน";
            } else if (item.locationOrder === 'Grab') {
                bgColor = 'bg-success-subtle';
                locationOrderText = "Grab";
            }
            
            let bgDischargeColor = 'btn-warning';
            let bgFinishedOrderColor = 'btn-warning';
            if (item.discharge === true) {
                bgDischargeColor = 'btn-success';
                //bgColor = 'bg-success text-white ';
            }
            if (item.finishedOrder === true) {
                bgFinishedOrderColor = 'btn-success';
                bgColor = 'bg-warning';
            }

            let dischargeButton = '<button type="button" class="btn ' + bgDischargeColor + ' btn-update-discharge" data-id="' + item.id + '" data-customer="' + item.customerName + '" data-items=\'' + JSON.stringify(item.items) + '\'>คิดเงิน</button>';
            if (item.locationOrder === 'Grab') {
                dischargeButton = '<button type="button" class="btn ' + bgDischargeColor + ' btn-update-grab-discharge" data-id="' + item.id + '">ส่งแกรป</button>';

            }
            // สร้าง HTML สำหรับแต่ละ accordion item
            const orderItem = document.createElement("div");
            orderItem.classList.add("accordion-item");
            orderItem.innerHTML = `
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed ${bgColor}" type="button" data-bs-toggle="collapse"
                    data-bs-target="#panelsStayOpen-${item.id}" aria-expanded="false" aria-controls="panelsStayOpen-${item.id}">
                    ชื่อ : ${item.customerName} | เวลาสั่งซื้อ : ${item.orderTime} | ${locationOrderText}
                  </button>
                </h2>
                <div id="panelsStayOpen-${item.id}" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>รายการ :</strong>

                        <div class="d-flex align-items-center">
                        <select class="form-select me-2 table-select" style="width: auto;" data-id="${item.id}">
                            <option value="t1" ${item.tableNumber === 't1' ? 'selected' : ''}>โต๊ะ 1</option>
                            <option value="t2" ${item.tableNumber === 't2' ? 'selected' : ''}>โต๊ะ 2</option>
                            <option value="t3" ${item.tableNumber === 't3' ? 'selected' : ''}>โต๊ะ 3</option>
                            <option value="t4" ${item.tableNumber === 't4' ? 'selected' : ''}>โต๊ะ 4</option>
                            <option value="tw" ${item.tableNumber === 'tw' ? 'selected' : ''}>รอโต๊ะ</option>
                            <option value="ta" ${item.tableNumber === 'ta' ? 'selected' : ''}>กลับบ้าน</option>
                            <option value="grab" ${item.tableNumber === 'grab' ? 'selected' : ''}>Grab</option>
                        </select>
                        <button type="button" class="btn btn-primary btn-add-more-order" data-id="${item.id}" data-customer="${item.customerName}">เพิ่มเมนู</button>
                    </div>
                    </div>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>ชื่อรายการ</th>
                          <th>จำนวน</th>
                          <th>ทำแล้ว</th>
                          <th>ลบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${item.items.map((i, index) => `
                          <tr>
                            <td>${i.name} ${i.remark && i.remark.trim() !== '' ? `(${i.remark})` : ''} 
                             ${i.itemDischarge
                    ? `<img src="assets/img/paid-stamp-icon.png" alt="Paid" height="45" title="จ่ายเงินแล้ว">`
                    : ` `}
                            </td>
                            <td>${i.quantity}</td>
                            <td>
                                <input type="checkbox" class="item-checkbox" data-id="${item.id}" data-index="${index}" ${i.done ? 'checked' : ''}>
                            </td>
      
                             <td>
                                <button type="button" class="btn btn-danger btn-delete-item" data-id="${item.id}" data-index="${index}" data-name="${i.name}">ลบ</button>
                            </td>
                          </tr>
                           
                        `).join('')}
                      </tbody>
                    </table>

                    <div class="form-floating position-relative">
                        <textarea class="form-control pe-5" placeholder="ใส่หมายเหตุ" id="orderRemark-${item.id}" style="height: 100px">${item.remark}</textarea>
                        <label for="orderRemark-${item.id}">หมายเหตุ</label>
                        
                        <!-- ปุ่มบันทึกอยู่ข้างใน textarea -->
                        <button type="button" class="btn btn-secondary btn-save-remark" data-id="${item.id}"
                            style="position: absolute; bottom: 5px; right: 5px; font-size: 0.8rem; padding: 4px 8px;">
                            บันทึก
                        </button>
                    </div>
                    
                    <br>
                    <div class="d-flex justify-content-between align-items-center">
                        <button type="button" class="btn btn-danger btn-update-delete" data-id="${item.id}">ลบ order</button>
                        <div>
                            <button type="button" class="btn ${bgFinishedOrderColor} btn-update-finishedOrder" data-id="${item.id}">ทำครบแล้ว</button>
                            ${dischargeButton}
                        </div>
                    </div>
                  </div>
                </div>
            `;

            // เพิ่ม accordion item ลงใน container
            currentOrderContainer.appendChild(orderItem);
        }
    });
}



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

        // สร้างรายการในรูปแบบ list item
        const menuItem = document.createElement("li");
        menuItem.className = "list-group-item d-flex justify-content-between align-items-center";

        menuItem.innerHTML = `
            <div class="d-flex flex-column">
                <span class="fw-bold">${item.name}</span>
                <span class="text-muted">ราคา: ${item.price} THB</span>
            </div>
            <button type="button" class="btn btn-outline-dark add-to-cart ms-3" 
                data-id="${item.id}" 
                data-name="${item.name}" 
                data-price="${item.price}"
                data-addtopping="${item.addTopping}">
                ADD
                <span class="menuCount_${item.id} badge bg-primary text-white ms-1 rounded-pill"></span>
            </button>
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
function addToCart(id, name, price, addMenuRemark = "", addMenuQTY = 1) {
    // ตรวจสอบว่าสินค้าอยู่ในรถเข็นแล้วหรือไม่
    const existingItem = cartItems.find(item => item.id === id);
    if (Number(addMenuQTY) < 1) {
        addMenuQTY = 1; // รีเซ็ตเป็น 1 ถ้าค่าต่ำกว่า 1
    }
    if (existingItem) {
        // หากมีอยู่แล้ว เพิ่มจำนวน
        if (existingItem.remark != addMenuRemark) {
            cartItems.push({ id, name, price, quantity: Number(addMenuQTY), is_done: false, remark: addMenuRemark, itemDischarge: false });
        }
        else {
            existingItem.quantity += Number(addMenuQTY);
        }

    } else {
        // หากยังไม่มี เพิ่มสินค้าใหม่
        cartItems.push({ id, name, price, quantity: Number(addMenuQTY), is_done: false, remark: addMenuRemark, itemDischarge: false });
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
}

function updateOrderToKitchen(orderId) {
    const id = orderId;  // ได้ ID ของ doc ที่จะอัพเดตจากปุ่ม

    // ตรวจสอบว่ามีสินค้าในรถเข็นหรือไม่
    if (cartItems.length === 0) {
        Swal.fire({
            title: "กรุณาเพิ่มสินค้าในรถเข็นก่อนยืนยัน Order",
            icon: "warning"
        });
        return;
    }

    // เชื่อมต่อกับ Firestore เพื่อดึงข้อมูลเดิมของ order
    const orderRef = doc(db, 'orders', id);  // 'orders' คือ collection และ id คือ doc id

    // ดึงข้อมูลปัจจุบันจาก Firestore
    getDoc(orderRef)
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                // ถ้ามีข้อมูลใน Firestore
                const currentOrder = docSnapshot.data();

                // รวม item ใน cartItems กับ items ที่มีอยู่ใน order
                const updatedItems = [...currentOrder.items, ...cartItems];

                // ข้อมูลที่ต้องการอัพเดต
                const orderData = {
                    items: updatedItems,
                    discharge: false,
                    finishedOrder: false
                };

                // อัพเดตข้อมูลใน Firestore
                updateDoc(orderRef, orderData)
                    .then(() => {
                        Swal.fire({
                            title: "บันทึกสำเร็จ !",
                            icon: "success",
                            timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                            timerProgressBar: true,
                            showConfirmButton: false
                        }).then(() => {
                            // location.reload();  // รีโหลดหน้า
                            $('#addMenuModal').modal('hide');
                            getCurrentOrder();
                        });
                    })
                    .catch((error) => {
                        Swal.fire({
                            title: "เกิดข้อผิดพลาด โปรดแจ้งพี่สเก็ต",
                            text: error.message,
                            icon: "error"
                        });
                    });

            } else {
                // ถ้าไม่มีข้อมูลใน Firestore (กรณีไม่พบ document ที่มี id นี้)
                Swal.fire({
                    title: "ไม่พบ order นี้ในระบบ",
                    icon: "error"
                });
            }
        })
        .catch((error) => {
            Swal.fire({
                title: "เกิดข้อผิดพลาดในการดึงข้อมูล",
                text: error.message,
                icon: "error"
            });
            console.log(error.message);
        });
}

// ฟังก์ชันสำหรับลบรายการจากคำสั่งซื้อ
// async function deleteItemFromOrder(orderId, itemIndex) {
//     try {
//         // ค้นหาเอกสารของ order ที่ต้องการแก้ไข
//         const orderDocRef = doc(db, 'orders', orderId); // 'orders' คือ collection และ orderId คือ doc id
//         const orderSnapshot = await getDoc(orderDocRef);

//         if (orderSnapshot.exists()) {
//             const orderData = orderSnapshot.data();

//             // ลบรายการออกจาก items
//             orderData.items.splice(itemIndex, 1);

//             // อัปเดตข้อมูลใน Firestore
//             await updateDoc(orderDocRef, { items: orderData.items });

//             // อัปเดตหน้าจอ
//             getCurrentOrder(); // ดึงข้อมูลใหม่เพื่อแสดงผล
//         } else {
//             console.error("Order not found");
//         }
//     } catch (error) {
//         console.error("Error deleting item from order:", error);
//     }
// }

// ฟังก์ชันลบ item ทีละ qty
async function deleteItemFromOrder(orderId, itemIndex) {
    try {
        // ดึงข้อมูล order ปัจจุบันจาก Firestore
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
            const orderData = orderDoc.data();

            // ตรวจสอบจำนวน quantity ของ item
            const item = orderData.items[itemIndex];
            if (item.quantity > 1) {
                // ลด quantity ลง 1 และอัปเดตราคา (สมมติว่ามี `item.price` เป็นราคาต่อหน่วย)
                item.quantity -= 1;
                item.totalPrice = item.quantity * item.price; // คำนวณราคาทั้งหมดใหม่ (ถ้ามี)

                // อัปเดตข้อมูลกลับใน Firestore
                await updateDoc(doc(db, 'orders', orderId), {
                    items: orderData.items
                });

                // แสดง Swal สำเร็จ
                Swal.fire({
                    title: 'ลบออก 1 จำนวน สำเร็จ',
                    icon: 'success',
                    timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } else {
                // ลบ item ออกจาก array ถ้า quantity = 1
                orderData.items.splice(itemIndex, 1);

                // อัปเดตข้อมูลกลับใน Firestore
                await updateDoc(doc(db, 'orders', orderId), {
                    items: orderData.items
                });

                // แสดง Swal สำเร็จ
                Swal.fire({
                    title: "ลบเรียบร้อย!",
                    icon: "success",
                    timer: 1000, // ปิดอัตโนมัติใน 1.5 วินาที
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            }

            // อัปเดต UI
            $(`.btn-delete-item[data-id="${orderId}"][data-index="${itemIndex}"]`).closest('tr').remove();

        } else {
            Swal.fire(
                'เกิดข้อผิดพลาด',
                'ไม่พบข้อมูลรายการในฐานข้อมูล',
                'error'
            );
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        Swal.fire(
            'เกิดข้อผิดพลาด',
            'ไม่สามารถลบข้อมูลได้',
            'error'
        );
    } finally {
        getCurrentOrder();
    }


}
let lastActivityTimestamp = Date.now();

function updateLastActivity() {
    lastActivityTimestamp = Date.now();
}

['click', 'mousemove', 'keydown', 'scroll'].forEach(eventName => {
    document.addEventListener(eventName, updateLastActivity);
});

// ตรวจสอบทุก 5 วินาที
setInterval(() => {
    const now = Date.now();
    const secondsSinceLastActivity = (now - lastActivityTimestamp) / 1000;

    if (secondsSinceLastActivity >= 20) {
        console.log("🕒 ไม่มีการใช้งาน > 20 วินาที → รีโหลดข้อมูลใหม่");

        // หากคุณใช้ Firestore real-time อยู่แล้ว อาจไม่ต้องทำอะไร
        // แต่ถ้าใช้ get() หรือต้องการ refresh DOM เอง ให้เรียกตรงนี้:
        getCurrentOrder();

        // รีเซ็ตเวลาใหม่ (ป้องกันเรียกซ้ำทุก 5 วิ)
        lastActivityTimestamp = now;
    }
}, 5000);


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