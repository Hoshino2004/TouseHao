import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getDatabase, ref as dbRef, get, child, set, remove, update } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-storage.js";

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
const storage = getStorage(app);

// Biến lưu trữ ID học viên sẽ xóa hoặc chỉnh sửa
let houseToDeleteId = null;
let houseToEditId = null;

let currentPage = 1; // Trang hiện tại
const housesPerPage = 3; // Số học viên mỗi trang
let totalHouses = 0; // Tổng số học viên

let houses = []; // Khai báo biến students toàn cục

async function createNewId(databaseRef) {
    const housesRef = dbRef(databaseRef, 'Data House');  // Sử dụng ref() thay vì child()

    // Lấy toàn bộ dữ liệu từ nhánh 'Data House'
    const snapshot = await get(housesRef);  // Sử dụng await để đảm bảo dữ liệu đã được lấy
    const housesData = snapshot.val();

    // Nếu nhánh 'Data House' trống thì bắt đầu từ 0
    let newId = 0;

    if (housesData) {
        // Lấy tất cả các ID hiện có
        const houseIds = Object.keys(housesData).map(id => parseInt(id)); // Chuyển id về số nguyên

        // Sắp xếp các ID theo thứ tự tăng dần
        houseIds.sort((a, b) => a - b);

        // Duyệt qua tất cả các ID và tìm khoảng trống
        for (let i = 0; i < houseIds.length; i++) {
            if (i !== houseIds[i]) {  // Tìm thấy khoảng trống
                newId = i;
                return newId;
            }
        }

        // Nếu không có khoảng trống, ID mới sẽ là số lớn nhất + 1
        newId = houseIds.length;
    }

    return newId;
}


// Hàm lấy dữ liệu từ Firebase
async function getHouses() {
    const dbRef1 = dbRef(database);
    try {
        const snapshot = await get(child(dbRef1, 'Data House'));
        if (snapshot.exists()) {
            return snapshot.val(); // Trả về dữ liệu học viên
        } else {
            console.log("No data available");
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}



// Đang sửa dở hàm displayHouses



// Hàm hiển thị học viên lên table
function displayHouses(houses, page = 1) {
    const tableBody = document.querySelector("#house-management tbody");
    tableBody.innerHTML = ""; // Xóa nội dung cũ

    // Tính toán các chỉ số của học viên cần hiển thị trên trang
    const startIndex = (page - 1) * housesPerPage;
    const endIndex = Math.min(startIndex + housesPerPage, houses.length);

    // Hiển thị học viên theo trang
    for (let i = startIndex; i < endIndex; i++) {
        const house = houses[i];
        const row = document.createElement("tr");
        row.innerHTML = `
    <td>${house.id}</td>
    <td><img src="${house.image}" alt="Ảnh nhà" style="width:170px"></td>
    <td>${house.gia}</td>
    <td>${house.quan}</td>
    <td>${house.loainha}</td>
    <td>${house.tinhtrang}</td>
    <td>
      <button class="edit-btn">Sửa</button>
      <button class="delete-btn">Xóa</button>
    </td>
  `;
        tableBody.appendChild(row);
    }

    addDeleteEventListeners(); // Gán sự kiện cho nút "Xóa"
    addEditEventListeners();   // Gán sự kiện cho nút "Sửa"

    // Cập nhật thông tin phân trang
    document.getElementById("pageInfo").textContent = `Trang ${page} / ${Math.ceil(totalHouses / housesPerPage)}`;
    // Gọi hàm này sau khi hiển thị học viên
    updatePagination();
}

document.getElementById("prevPage").addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        displayHouses(Object.values(houses), currentPage);
    }
});

document.getElementById("nextPage").addEventListener("click", function () {
    if (currentPage * housesPerPage < totalHouses) {
        currentPage++;
        displayHouses(Object.values(houses), currentPage);
    }
});

function updatePagination() {
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage * housesPerPage >= totalHouses;
}

// Hàm ghi dữ liệu vào Firebase
async function addHouse(house) {
    const dbRef1 = dbRef(database, 'Data House/' + house.id); // Sử dụng mã học viên làm ID
    try {
        await set(dbRef1, house);
        console.log("House added successfully");
        // Sau khi thêm thành công, gọi lại hàm hiển thị
        displayHouses(houses, currentPage); // Cập nhật lại danh sách học viên
    } catch (error) {
        console.error("Error adding house: ", error);
    }
}

// Hàm cập nhật học viên
async function updateHouse(houseId, updatedData, newFile) {
    const dbRef1 = dbRef(database, 'Data House/' + houseId); // Đường dẫn đến nhà cần cập nhật

    try {
        // Lấy dữ liệu hiện tại của nhà
        const houseSnapshot = await get(dbRef1);
        if (houseSnapshot.exists()) {
            const houseData = houseSnapshot.val();

            let houseImage = houseData.image;  // Giữ URL ảnh cũ mặc định nếu không có thay đổi

            // Kiểm tra nếu có file ảnh mới được upload
            if (newFile) {
                // Nếu nhà có ảnh cũ, xóa ảnh cũ khỏi Firebase Storage
                if (houseData.image) {
                    const oldImageRef = storageRef(storage, `image/${houseId}`);

                    try {
                        await deleteObject(oldImageRef);
                        console.log(`Ảnh cũ của nhà ${houseId} đã được xóa khỏi Storage.`);
                    } catch (storageError) {
                        console.error("Lỗi khi xóa ảnh cũ: ", storageError);
                    }
                }

                // Upload ảnh mới lên Firebase Storage
                const storageRef1 = storageRef(storage, `image/${houseId}`);
                try {
                    const snapshot = await uploadBytesResumable(storageRef1, newFile);
                    houseImage = await getDownloadURL(snapshot.ref);  // Lấy URL ảnh mới
                    console.log('File mới có sẵn tại', houseImage);
                } catch (error) {
                    console.error("Lỗi khi upload ảnh mới: ", error);
                    return; // Ngăn không cho lưu dữ liệu nếu upload ảnh thất bại
                }
            }

            // Cập nhật dữ liệu nhà với ảnh mới hoặc giữ nguyên ảnh cũ
            const updatedHouse = {
                ...updatedData,  // Giữ lại các trường dữ liệu khác
                image: houseImage // Cập nhật URL ảnh mới (nếu có) hoặc giữ nguyên
            };

            // Cập nhật vào Realtime Database
            await update(dbRef1, updatedHouse);
            console.log("House updated successfully");
        } else {
            console.log("Không tìm thấy nhà để cập nhật.");
        }
    } catch (error) {
        console.error("Error updating house: ", error);
    }
}


// Hàm khởi tạo
async function init() {
    const housesData = await getHouses();
    if (housesData) {
        houses = Object.values(housesData); // Lưu trữ học viên vào biến toàn cục
        totalHouses = houses.length; // Cập nhật tổng số học viên
        displayHouses(houses, currentPage); // Hiển thị trang đầu tiên
    } else {
        totalHouses = 0; // Nếu không có học viên, đặt totalStudents về 0
    }
}



// Hàm để gán sự kiện cho các nút "Xóa"
function addDeleteEventListeners() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            houseToDeleteId = this.closest('tr').children[0].textContent; // Lấy mã học viên từ hàng
            document.querySelector("#deleteModal p").textContent =
                `Bạn có chắc chắn muốn xóa nhà có id ${houseToDeleteId} này không?`; // Cập nhật thông điệp
            document.getElementById("deleteModal").style.display = "block"; // Hiện modal xác nhận
        });
    });
}

// Gán sự kiện cho các nút "Sửa"
function addEditEventListeners() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", async function () {

            houseToEditId = this.closest('tr').children[0].textContent; // Lấy mã học viên từ hàng
            const dbRef1 = dbRef(database, 'Data House/' + houseToEditId);
            const snapshot = await get(dbRef1);

            if (snapshot.exists()) {
                const house = snapshot.val();

                // Điền thông tin vào các input trong modal
                // document.getElementById("houseImage").value = house.image;
                document.getElementById("imgPreview").src = house.image;

                document.getElementById("houseDescription").value = house.mota;
                document.getElementById("houseDetailDescription").value = house.motachitiet;
                document.getElementById("houseAddress").value = house.diachi;
                document.getElementById("houseArea").value = house.dientich;
                document.getElementById("housePrice").value = house.gia;
                document.getElementById("houseStatus").value = house.tinhtrang;
                document.getElementById("houseContact").value = house.thongtinlienhe;

                // Gọi hàm để điền dữ liệu vào spinner và chọn lớp hiện tại
                await populateDistrictSpinner();
                await populateStatusSpinner();
                await populateHouseTypeSpinner();
                await populateRenterSpinner();

                document.getElementById("houseType").value = house.loainha;
                document.getElementById("houseDistrict").value = house.quan;
                document.getElementById("houseStatus").value = house.tinhtrang;
                document.getElementById("houseRenter").value = house.nguoithue;

                // Kiểm tra giá trị ban đầu khi mở modal (có thể cần nếu bạn mở modal để sửa)
                document.getElementById("houseStatus").dispatchEvent(new Event("change"));

                // Cập nhật tiêu đề và nút trong modal cho chế độ sửa
                document.getElementById("modalTitle").textContent = "Sửa thông tin nhà";
                document.getElementById("modalSubmitBtn").textContent = "Cập nhật";

                // Hiển thị modal
                document.getElementById("houseModal").style.display = "block";
            }
        });
    });

}

// Xử lý xác nhận xóa
document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
    if (houseToDeleteId) {
        deleteHouse(houseToDeleteId); // Xóa học viên
        document.getElementById("deleteModal").style.display = "none"; // Đóng modal xác nhận
        houseToDeleteId = null; // Đặt lại biến
    }
});

// Hàm xóa học viên khỏi Firebase
async function deleteHouse(houseId) {
    const dbRef1 = dbRef(database, 'Data House/' + houseId); // Đường dẫn đến nhà cần xóa

    try {
        // Lấy dữ liệu của nhà trước khi xóa để lấy URL ảnh
        const houseSnapshot = await get(dbRef1);
        if (houseSnapshot.exists()) {
            const houseData = houseSnapshot.val();

            // Kiểm tra xem URL ảnh có tồn tại không
            if (houseData.image) {
                // Tạo reference đến ảnh trong Storage từ ID nhà
                const storageRef1 = storageRef(storage, `image/${houseId}`);

                try {
                    // Xóa ảnh khỏi Firebase Storage
                    await deleteObject(storageRef1);
                    console.log(`Ảnh của nhà ${houseId} đã được xóa khỏi Storage.`);
                } catch (storageError) {
                    console.error("Lỗi khi xóa ảnh: ", storageError);
                }
            }

            // Xóa dữ liệu nhà khỏi Realtime Database
            await remove(dbRef1);
            console.log(`Nhà ${houseId} đã được xóa khỏi Realtime Database.`);
            init(); // Cập nhật lại bảng sau khi xóa
        } else {
            console.log("Không tìm thấy nhà để xóa.");
        }
    } catch (error) {
        console.error("Lỗi khi xóa nhà: ", error);
    }
}


// Đóng modal khi bấm nút đóng
document.querySelectorAll(".close").forEach(closeButton => {
    closeButton.addEventListener("click", function () {
        document.getElementById("houseModal").style.display = "none"; // Đóng modal
        document.getElementById("deleteModal").style.display = "none"; // Đóng modal xác nhận
    });
});

// Nút "Hủy" trong modal
document.querySelector(".cancel-btn").addEventListener("click", function () {
    document.getElementById("houseModal").style.display = "none"; // Đóng modal
});

// Nút "Hủy" trong modal xóa
document.getElementById("cancelDeleteBtn").addEventListener("click", function () {
    document.getElementById("deleteModal").style.display = "none"; // Đóng modal xác nhận xóa
    houseToDeleteId = null; // Đặt lại biến để không xóa học viên
});

const houseImageInput = document.getElementById('houseImage');
const imgPreview = document.getElementById('imgPreview');

document.getElementById("houseStatus").addEventListener("change", function () {
    const houseRenterLabel = document.getElementById("houseRenterLabel");
    const houseRenterSelect = document.getElementById("houseRenter");

    // Kiểm tra giá trị của spinner houseStatus
    if (this.value === "Chưa cho thuê") {
        // Ẩn label và select của người thuê
        houseRenterLabel.style.display = "none";
        houseRenterSelect.style.display = "none";
    } else {
        // Hiện lại nếu tình trạng khác "Chưa cho thuê"
        houseRenterLabel.style.display = "block";
        houseRenterSelect.style.display = "block";
    }
});

// Sự kiện khi modal thêm hoặc sửa học viên được gửi
document.querySelector(".modal-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Ngăn không cho reload trang

    const file = houseImageInput.files[0]; // Lấy file từ input
    let houseImage = "";  // Khởi tạo biến để lưu URL ảnh

    try {
        if (!houseToEditId && !file) {
            // Trường hợp thêm nhà mới mà không có file ảnh
            alert("Vui lòng chọn một file để upload!");
            return;
        }

        if (file) {
            let idHouseToUse = houseToEditId || await createNewId(database); // Dùng ID đã có nếu chỉnh sửa, tạo ID mới nếu thêm nhà

            const storageRef1 = storageRef(storage, `image/${idHouseToUse}`);

            // Chờ việc upload hoàn thành
            const snapshot = await uploadBytesResumable(storageRef1, file);
            houseImage = await getDownloadURL(snapshot.ref);  // Lấy URL sau khi upload
            console.log('File available at', houseImage);
        }
    } catch (error) {
        console.error("Lỗi upload:", error);
        return;  // Ngăn không cho lưu dữ liệu nếu upload thất bại
    }

    const houseDescription = document.getElementById("houseDescription").value;
    const houseDetailDescription = document.getElementById("houseDetailDescription").value;
    const houseAddress = document.getElementById("houseAddress").value;
    const houseArea = document.getElementById("houseArea").value;
    const housePrice = parseInt(document.getElementById("housePrice").value) || 0;
    const houseType = document.getElementById("houseType").value;
    const houseDistrict = document.getElementById("houseDistrict").value;
    const houseStatus = document.getElementById("houseStatus").value;
    const houseRenter = document.getElementById("houseRenter").value;
    const houseContact = document.getElementById("houseContact").value;

    if (houseToEditId) {
        // Nếu đang chỉnh sửa học viên
        const updatedHouse = {
            diachi: houseAddress,
            dientich: houseArea,
            gia: housePrice,
            image: houseImage,
            loainha: houseType,
            mota: houseDescription,
            motachitiet: houseDetailDescription,
            quan: houseDistrict,
            nguoithue: houseRenter,
            thongtinlienhe: houseContact,
            tinhtrang: houseStatus,
        };

        // Nếu có ảnh mới, thêm URL ảnh mới vào dữ liệu cập nhật
        if (houseImage) {
            updatedHouse.image = houseImage;
        }

        await updateHouse(houseToEditId, updatedHouse, file); // Cập nhật dữ liệu
    } else {
        // Thêm học viên mới
        let idHouse1 = await createNewId(database);  // Đảm bảo rằng bạn đã có ID mới
        console.log("ID mới là: ", idHouse1);


        const newHouse = {
            id: idHouse1,
            diachi: houseAddress,
            dientich: houseArea,
            gia: housePrice,
            image: houseImage,
            loainha: houseType,
            nguoithue: houseRenter,
            mota: houseDescription,
            motachitiet: houseDetailDescription,
            quan: houseDistrict,
            thongtinlienhe: houseContact,
            tinhtrang: houseStatus,
        };

        await addHouse(newHouse); // Ghi dữ liệu vào Firebase
    }

    document.getElementById("houseModal").style.display = "none"; // Đóng modal
    init(); // Cập nhật lại bảng
});

// Khởi chạy khi trang đã tải
document.addEventListener("DOMContentLoaded", function () {
    init();

    // Gán sự kiện cho nút "Thêm học viên"
    document.getElementById("openModalBtn").addEventListener("click", function () {

        document.getElementById("modalTitle").textContent = "Thêm nhà mới"; // Cập nhật tiêu đề
        document.getElementById("modalSubmitBtn").textContent = "Thêm"; // Cập nhật nút
        document.getElementById("houseModal").style.display = "block"; // Hiện modal

        // Đặt lại các giá trị input trong modal
        // document.getElementById("houseImage").value = "";
        document.getElementById("imgPreview").src = "";
        if (houseImageInput && imgPreview) {
            houseImageInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        imgPreview.setAttribute('src', e.target.result);
                    }
                    reader.readAsDataURL(file);
                }
            });
        }

        document.getElementById("houseDescription").value = "";
        document.getElementById("houseDetailDescription").value = "";
        document.getElementById("houseAddress").value = "";
        document.getElementById("houseArea").value = "";
        document.getElementById("housePrice").value = "";
        document.getElementById("houseContact").value = "";

        document.getElementById("houseType").value = "Chung cư";
        document.getElementById("houseDistrict").value = "Quận 1";
        document.getElementById("houseStatus").value = "Chưa cho thuê";
        document.getElementById("houseRenter").value = "EMPTY"

        houseToEditId = null; // Đảm bảo không ở trạng thái chỉnh sửa

        // Kiểm tra giá trị ban đầu khi mở modal (có thể cần nếu bạn mở modal để sửa)
        document.getElementById("houseStatus").dispatchEvent(new Event("change"));
    });

    // Gọi hàm để điền dữ liệu vào spinner
    populateDistrictSpinner();
    populateHouseTypeSpinner();
    populateStatusSpinner();
    populateRenterSpinner();
});

// Đóng modal khi click bên ngoài modal
window.addEventListener("click", function (event) {
    const houseModal = document.getElementById("houseModal");
    const deleteModal = document.getElementById("deleteModal");

    if (event.target === houseModal) {
        houseModal.style.display = "none";
    }

    if (event.target === deleteModal) {
        deleteModal.style.display = "none";
    }
});


// Hàm lấy danh sách lớp học từ Firebase và hiển thị vào spinner
async function populateDistrictSpinner() {
    const dbRef1 = dbRef(database);
    try {
        const snapshot = await get(child(dbRef1, 'District'));
        if (snapshot.exists()) {
            const districts = snapshot.val();
            const districtSelect = document.getElementById("houseDistrict");
            districtSelect.innerHTML = ""; // Xóa các tùy chọn hiện có

            districts.forEach((district) => {
                if (district !== "--Tất cả--") {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    districtSelect.appendChild(option);
                }
            });
        } else {
            console.log("No class data available");
        }
    } catch (error) {
        console.error("Error fetching districts: ", error);
    }
}

async function populateHouseTypeSpinner() {
    const dbRef1 = dbRef(database);
    try {
        const snapshot = await get(child(dbRef1, 'HouseType'));
        if (snapshot.exists()) {
            const houseTypes = snapshot.val();
            const houseTypeSelect = document.getElementById("houseType");
            houseTypeSelect.innerHTML = ""; // Xóa các tùy chọn hiện có

            houseTypes.forEach((houseType) => {
                if (houseType !== "--Tất cả--") {
                    const option = document.createElement('option');
                    option.value = houseType;
                    option.textContent = houseType;
                    houseTypeSelect.appendChild(option);
                }
            });
        } else {
            console.log("No class data available");
        }
    } catch (error) {
        console.error("Error fetching house types: ", error);
    }
}

async function populateStatusSpinner() {
    const dbRef1 = dbRef(database);
    try {
        const snapshot = await get(child(dbRef1, 'TinhTrangThueNha'));
        if (snapshot.exists()) {
            const statuses = snapshot.val();
            const statusSelect = document.getElementById("houseStatus");
            statusSelect.innerHTML = ""; // Xóa các tùy chọn hiện có

            statuses.forEach((status) => {
                if (status !== "--Tất cả--") {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    statusSelect.appendChild(option);
                }
            });
        } else {
            console.log("No class data available");
        }
    } catch (error) {
        console.error("Error fetching statuses: ", error);
    }
}

async function populateRenterSpinner() {
    const dbRef1 = dbRef(database);
    try {
        const snapshot = await get(child(dbRef1, 'User name'));
        if (snapshot.exists()) {
            const renters = snapshot.val(); // renters là một object
            const renterSelect = document.getElementById("houseRenter");
            renterSelect.innerHTML = ""; // Xóa các tùy chọn hiện có

            // Sử dụng Object.keys để lấy các key của object
            Object.keys(renters).forEach((renterId) => {
                const renterName = renters[renterId];
                const option = document.createElement('option');
                option.value = renterName; // Dùng ID làm value
                option.textContent = renterName; // Hiển thị tên người thuê
                renterSelect.appendChild(option);
            });
        } else {
            console.log("No renter data available");
        }
    } catch (error) {
        console.error("Error fetching renters: ", error);
    }
}



