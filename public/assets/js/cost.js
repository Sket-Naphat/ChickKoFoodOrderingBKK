// Import the necessary Firebase SDKs
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0];
    // ตั้งค่า value ของ input ด้วย jQuery
    $('#dateInput').val(today);



    $('#fetchDataBtn').on('click', async function () {
        const originalButtonHTML = $('#fetchDataBtn').html(); // เก็บ HTML เดิมของปุ่ม
        $('#fetchDataBtn').prop('disabled', true).html(`
            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <span role="status">Loading...</span>
        `); // เปลี่ยนปุ่มเป็น Loading
        try {
            // ล้าง DataTable เก่า ถ้ามีอยู่
            if ($.fn.DataTable.isDataTable('#reportTable')) {
                $('#reportTable').DataTable().clear().destroy();
            }

            // สร้าง DataTable ใหม่
            const table = $('#reportTable').DataTable({
                "processing": true,
                "order": [[0, "desc"]], // เรียงลำดับวันที่มากไปน้อย
                "columns": [
                    { "data": "date" },
                    { "data": "costTotal" },
                    { "data": "cost" },
                    { "data": "costOrtherInput" },
                    { "data": "remark" },
                    { "data": "tools", "orderable": false } // ปิดการเรียงลำดับในคอลัมน์เครื่องมือ
                ],
                "dom": 'Bfrtip', // เพิ่มปุ่ม Export
                "buttons": [
                    {
                        extend: 'excelHtml5',
                        text: 'Export to Excel',
                        title: 'ราคาต้นทุน'                     
                    },
                    {
                        extend: 'print',
                        text: 'Print Report',
                        title: 'ราคาต้นทุน'
                    }
                ]
            });

            // ดึงข้อมูลจาก Firestore
            const costQuery = query(collection(db, 'cost'), orderBy('date', 'desc'));
            const costSnapshot = await getDocs(costQuery);

            costSnapshot.forEach((costDoc) => {
                const data = costDoc.data();

                table.row.add({
                    "date": data.date || "-",
                    "costTotal": (Number((data.cost ? data.cost : 0))) + (Number((data.costOrtherInput ? data.costOrtherInput : 0))), // คำนวณต้นทุนรวม
                    "cost": data.cost || "-",
                    "costOrtherInput": data.costOrtherInput || "-",
                    "remark": data.remark || "-",
                    "tools": `<button class="btn btn-danger btn-sm delete-btn" data-id="${costDoc.id}">ลบ</button>`
                }).draw();
            });

            // กำหนด event ลบข้อมูล
            $('#reportTable tbody').off('click', '.delete-btn').on('click', '.delete-btn', async function () {
                const docId = $(this).data('id');
                const row = $(this).closest('tr');

                Swal.fire({
                    title: 'คุณต้องการลบรายการนี้หรือไม่?',
                    text: "การลบนี้ไม่สามารถย้อนกลับได้!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'ลบ',
                    cancelButtonText: 'ยกเลิก'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            await deleteDoc(doc(db, 'cost', docId));
                            table.row(row).remove().draw(); // ลบแถวออกจาก DataTable
                            Swal.fire('ลบสำเร็จ!', 'รายการถูกลบเรียบร้อยแล้ว', 'success');
                        } catch (error) {
                            console.error('Error deleting document:', error);
                            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้ โปรดลองอีกครั้ง', 'error');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        }
        finally {
            $('#fetchDataBtn').prop('disabled', false).html(originalButtonHTML); // คืนปุ่มกลับสู่สถานะเดิม
        }
    });

    $('#saveCost').on('click', async function () {

        const dateInput = $('#dateInput').val();
        const costInput = $('#costInput').val();
        const costOrtherInput = $('#costOrtherInput').val();
        const costRemark = $('#costRemark').val();
        if (!costInput || !costOrtherInput) {
            alert('กรุณาใส่ข้อมูลให้ครบ');
            return;
        }

        //Send to kitchen
        const costData = {
            date: dateInput,
            cost: costInput,
            costOrtherInput: costOrtherInput,
            Remark: costRemark,
        };

        try {
            await addDoc(collection(db, "cost"), costData);

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


    });

});
