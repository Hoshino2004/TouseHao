import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDNiBtRZ-INRF4XJQ34gBpkT2AqT_a3gUE",
    authDomain: "tousehao.firebaseapp.com",
    databaseURL: "https://tousehao-default-rtdb.firebaseio.com",
    projectId: "tousehao",
    storageBucket: "tousehao.appspot.com",
    messagingSenderId: "125370925108",
    appId: "1:125370925108:web:5280f2696aca800812ca61",
    measurementId: "G-PT1WHF8JP8"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Lấy ID báo cáo từ URL
const urlParams = new URLSearchParams(window.location.search);
const reportId = urlParams.get('id');

// Lấy dữ liệu của báo cáo từ Firebase dựa trên ID
const noticeReportRef = ref(database, `Notice Report Admin/${reportId}`);
let reportData;  // Biến để lưu trữ thông tin báo cáo
get(noticeReportRef).then((snapshot) => {
    if (snapshot.exists()) {
        reportData = snapshot.val();
        document.getElementById('idNha').textContent = reportData.idNha;
        document.getElementById('email').textContent = reportData.email;
        document.getElementById('notice').textContent = reportData.notice;
        document.getElementById('tinhtrang').textContent = reportData.tinhtrang;
        document.getElementById('note').textContent = reportData.note;

        // Hiển thị ảnh nhà
        const img = document.getElementById('houseImage2');
        img.src = reportData.image;
    } else {
        alert("Không tìm thấy dữ liệu!");
    }
});

// Hiển thị modal khi nhấn nút "Cập nhật trạng thái"
const modal = document.getElementById('updateModal');
document.getElementById('openModalBtn').addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Đóng modal
document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.style.display = 'none';
});

// Lấy dữ liệu từ nhánh "TrangThaiReport" để đổ vào spinner
const statusRef = ref(database, 'TrangThaiReport');
const statusSpinner = document.getElementById('statusSpinner');

get(statusRef).then((snapshot) => {
    if (snapshot.exists()) {
        const statusData = snapshot.val();
        for (let i in statusData) {
            const option = document.createElement('option');
            option.value = statusData[i];
            option.text = statusData[i];
            statusSpinner.appendChild(option);
        }
    }
});

// Cập nhật trạng thái trong cả hai nhánh
document.getElementById('updateStatusBtn').addEventListener('click', () => {
    const newStatus = statusSpinner.value;

    // Cập nhật "tinhtrang" trong Notice Report Admin
    update(noticeReportRef, { tinhtrang: newStatus }).then(() => {
        alert('Cập nhật trạng thái trong Notice Report Admin thành công!');
        document.getElementById('tinhtrang').textContent = newStatus;

        // Tìm email và idReport để cập nhật tương ứng trong Notice Report
        let userEmail = reportData.email;
        userEmail = userEmail.replace('@gmail.com', ''); // Loại bỏ @gmail.com
        const idReport = reportData.idReport;

        const noticeReportUserRef = ref(database, `Notice Report/${userEmail}`);
        get(noticeReportUserRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userReports = snapshot.val();
                let reportKey = null;

                // Tìm idReport tương ứng
                for (let key in userReports) {
                    if (userReports[key].idReport === idReport) {
                        reportKey = key;
                        break;
                    }
                }

                if (reportKey) {
                    // Cập nhật tinhtrang trong Notice Report
                    const userReportRef = ref(database, `Notice Report/${userEmail}/${reportKey}`);
                    update(userReportRef, { tinhtrang: newStatus }).then(() => {
                        alert('Cập nhật trạng thái trong Notice Report thành công!');
                    }).catch((error) => {
                        alert('Lỗi cập nhật trong Notice Report: ' + error.message);
                    });
                }
            }
        });

        modal.style.display = 'none';  // Đóng modal sau khi cập nhật
    }).catch((error) => {
        alert('Lỗi cập nhật trạng thái: ' + error.message);
    });
});