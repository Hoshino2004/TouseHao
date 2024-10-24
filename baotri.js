import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";

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

// Tham chiếu tới nhánh 'Notice Report Admin'
const noticeReportRef = ref(database, 'Notice Report Admin');

// Lấy phần tử tbody
const tbody = document.querySelector('tbody');

// Biến phân trang
let currentPage = 1;
const recordsPerPage = 6; // Số lượng bản ghi trên mỗi trang
let totalPages = 1;
let allReports = []; // Lưu toàn bộ dữ liệu để phân trang

// Lấy dữ liệu từ Firebase
onValue(noticeReportRef, (snapshot) => {
    allReports = [];
    tbody.innerHTML = ''; // Xóa dữ liệu cũ

    const reports = snapshot.val();
    for (let key in reports) {
        allReports.push({ key, ...reports[key] }); // Thêm key để định danh báo cáo
    }

    totalPages = Math.ceil(allReports.length / recordsPerPage);
    displayPage(currentPage);
});

// Hiển thị dữ liệu theo trang
function displayPage(page) {
    tbody.innerHTML = ''; // Xóa dữ liệu cũ
    const start = (page - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const pageReports = allReports.slice(start, end);

    pageReports.forEach(report => {
        const row = document.createElement('tr');

        const idNhaCell = document.createElement('td');
        idNhaCell.textContent = report.idNha;

        const imageCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = report.image;
        img.alt = 'Ảnh nhà';
        img.width = 100;
        imageCell.appendChild(img);

        const emailCell = document.createElement('td');
        emailCell.textContent = report.email;

        const noticeCell = document.createElement('td');
        noticeCell.textContent = report.notice;

        const statusCell = document.createElement('td');
        statusCell.textContent = report.tinhtrang;

        row.appendChild(idNhaCell);
        row.appendChild(imageCell);
        row.appendChild(emailCell);
        row.appendChild(noticeCell);
        row.appendChild(statusCell);

        // Thêm sự kiện click để chuyển đến trang chi tiết
        row.addEventListener('click', () => {
            window.location.href = `detail.html?id=${report.key}`; // Chuyển sang trang chi tiết với ID báo cáo
        });

        tbody.appendChild(row);
    });

    document.getElementById('pageInfo').textContent = `Trang ${page} / ${totalPages}`;
}

// Xử lý sự kiện chuyển trang
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        displayPage(currentPage);
    }
});


