import { 
  login, 
  logout, 
  onAuthStateChange, 
  getPendingContributions, 
  updateContribution,
  getArchivedContributions,
  addDigitalBook,
  isSimulation 
} from './firebase-db.js';

function init() {
  initAdminAuth();
  initDashboardForms();
  
  const refreshArchiveBtn = document.getElementById("btn-refresh-archive");
  if (refreshArchiveBtn) {
    refreshArchiveBtn.addEventListener("click", () => {
      loadArchivedContributions();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// 1. Quản lý Trạng thái Đăng nhập & Hiển thị
function initAdminAuth() {
  const loginSection = document.getElementById("login-section");
  const dashboardSection = document.getElementById("dashboard-section");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("btn-logout");
  const loginError = document.getElementById("login-error");
  const adminEmailDisplay = document.getElementById("admin-email-display");
  const simNotice = document.getElementById("simulation-notice");

  // Hiển thị thông báo hướng dẫn đăng nhập nếu đang ở chế độ giả lập
  if (simNotice && isSimulation()) {
    simNotice.classList.remove("hidden");
  }

  // Lắng nghe trạng thái đăng nhập
  onAuthStateChange((user) => {
    if (user) {
      // Đã đăng nhập
      loginSection.classList.add("hidden");
      dashboardSection.classList.remove("hidden");
      if (adminEmailDisplay) {
        adminEmailDisplay.textContent = `Tài khoản: ${user.email} ${isSimulation() ? '(Giả lập)' : ''}`;
      }
      // Tải danh sách bài đóng góp chờ duyệt và kho lưu trữ
      loadPendingContributions();
      loadArchivedContributions();
    } else {
      // Chưa đăng nhập
      loginSection.classList.remove("hidden");
      dashboardSection.classList.add("hidden");
    }
  });

  // Xử lý nộp Form đăng nhập
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const submitBtn = loginForm.querySelector("button[type='submit']");

      if (!email || !password) {
        showError("Vui lòng nhập đầy đủ email và mật khẩu.");
        return;
      }

      try {
        loginError.classList.add("hidden");
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xác thực...
        `;

        await login(email, password);
        loginForm.reset();
      } catch (error) {
        console.error("Đăng nhập thất bại:", error);
        showError(error.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Đăng nhập hệ thống";
      }
    });
  }

  // Đăng xuất
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?")) {
        try {
          await logout();
        } catch (error) {
          console.error("Lỗi đăng xuất:", error);
        }
      }
    });
  }

  function showError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.classList.remove("hidden");
    }
    alert("Lỗi đăng nhập: " + msg);
  }
}

// 2. Logic Duyệt Bài (Dành cho Admin)
async function loadPendingContributions() {
  const pendingContainer = document.getElementById("pending-contributions-container");
  if (!pendingContainer) return;

  try {
    pendingContainer.innerHTML = `
      <div class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;

    const pendingList = await getPendingContributions();

    if (pendingList.length === 0) {
      pendingContainer.innerHTML = `
        <div class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-gray-500 font-medium">Hiện tại không có bài đóng góp nào cần duyệt.</p>
        </div>
      `;
      return;
    }

    pendingContainer.innerHTML = pendingList.map(item => `
      <div class="bg-white border border-gray-150 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between" id="contrib-card-${item.id}">
        <div>
          <div class="flex items-start justify-between gap-4 mb-2">
            <h4 class="font-bold text-gray-800 text-base">${item.title}</h4>
            <span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Chờ duyệt</span>
          </div>
          <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nội dung đóng góp (Có thể sửa tại đây):</label>
          <textarea 
            id="pending-textarea-${item.id}"
            rows="5"
            class="w-full p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D62D20]/20 focus:border-[#D62D20] transition duration-150 resize-y mb-4"
          >${item.content}</textarea>
        </div>
        <div class="border-t border-gray-100 pt-3 mt-2">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span class="font-semibold text-gray-700">Người gửi: ${item.authorName}</span>
            <span>Gửi lúc: ${new Date(item.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button 
              class="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-approve"
              data-id="${item.id}"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Duyệt đăng
            </button>
            <button 
              class="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-reject"
              data-id="${item.id}"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              Từ chối
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Gán sự kiện click nút Duyệt
    pendingContainer.querySelectorAll(".btn-approve").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const textarea = document.getElementById(`pending-textarea-${id}`);
        const contentVal = textarea ? textarea.value.trim() : null;
        await processContribution(id, 'approved', contentVal);
      });
    });

    // Gán sự kiện click nút Từ chối
    pendingContainer.querySelectorAll(".btn-reject").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const textarea = document.getElementById(`pending-textarea-${id}`);
        const contentVal = textarea ? textarea.value.trim() : null;
        if (confirm("Bạn có chắc muốn từ chối bài viết đóng góp này?")) {
          await processContribution(id, 'rejected', contentVal);
        }
      });
    });

  } catch (error) {
    console.error("Lỗi khi tải danh sách chờ duyệt:", error);
    pendingContainer.innerHTML = `<div class="text-center text-red-600 py-10">Lỗi khi kết nối dữ liệu.</div>`;
  }
}

async function processContribution(id, status, content = null) {
  const card = document.getElementById(`contrib-card-${id}`);
  const actionText = status === 'approved' ? 'duyệt đăng' : 'từ chối';
  
  try {
    if (card) {
      card.style.opacity = 0.5;
      card.style.pointerEvents = 'none';
    }

    const success = await updateContribution(id, status, content);
    
    if (success) {
      if (card) {
        card.style.transform = "scale(0.95)";
        setTimeout(() => {
          card.remove();
          // Kiểm tra xem còn bài nào không, nếu hết thì load lại để hiện thông báo trống
          const container = document.getElementById("pending-contributions-container");
          if (container && container.children.length === 0) {
            loadPendingContributions();
          }
          // Tải lại kho lưu trữ sau khi duyệt/từ chối
          loadArchivedContributions();
        }, 300);
      }
    } else {
      alert("Không thể cập nhật trạng thái bài viết.");
      if (card) {
        card.style.opacity = 1;
        card.style.pointerEvents = 'auto';
      }
    }
  } catch (error) {
    console.error(`Lỗi khi ${actionText} bài viết:`, error);
    alert(`Thao tác thất bại: ${error.message}`);
    if (card) {
      card.style.opacity = 1;
      card.style.pointerEvents = 'auto';
    }
  }
}

// 3. Logic Form thêm sách
function initDashboardForms() {
  const bookForm = document.getElementById("add-book-form");
  const submitBookBtn = document.getElementById("btn-submit-book");
  const bookSuccessAlert = document.getElementById("book-success-alert");

  if (!bookForm || !submitBookBtn) return;

  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bookTitle = document.getElementById("book-title").value.trim();
    const author = document.getElementById("book-author").value.trim();
    const summary = document.getElementById("book-summary").value.trim();

    if (!bookTitle || !author || !summary) {
      alert("Vui lòng điền đầy đủ tất cả thông tin của sách.");
      return;
    }

    try {
      submitBookBtn.disabled = true;
      submitBookBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Đang thêm vào tủ sách...
      `;

      await addDigitalBook(bookTitle, author, summary);

      bookForm.reset();

      // Hiển thị thông báo thành công
      if (bookSuccessAlert) {
        bookSuccessAlert.classList.remove("hidden");
        setTimeout(() => {
          bookSuccessAlert.classList.add("hidden");
        }, 4000);
      } else {
        alert("Thêm sách vào Tủ sách điện tử thành công!");
      }

    } catch (error) {
      console.error("Lỗi khi thêm sách:", error);
      alert("Lỗi hệ thống, không thể thêm sách lúc này.");
    } finally {
      submitBookBtn.disabled = false;
      submitBookBtn.textContent = "Thêm vào tủ sách";
    }
  });
}

// 4. Logic Kho Lưu Trữ Tư Liệu Chi Bộ
async function loadArchivedContributions() {
  const archiveContainer = document.getElementById("archive-contributions-container");
  if (!archiveContainer) return;

  try {
    archiveContainer.innerHTML = `
      <div class="col-span-full flex justify-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;

    const archivedList = await getArchivedContributions();

    if (archivedList.length === 0) {
      archiveContainer.innerHTML = `
        <div class="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p class="text-gray-500 font-medium">Kho lưu trữ hiện tại chưa có bài viết nào.</p>
        </div>
      `;
      return;
    }

    archiveContainer.innerHTML = archivedList.map(item => {
      const isApproved = item.status === 'approved';
      const statusBadge = isApproved 
        ? `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">Đã duyệt đăng</span>`
        : `<span class="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded">Đã từ chối</span>`;

      return `
        <div class="bg-gray-50/50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between" id="archive-card-${item.id}">
          <div>
            <div class="flex items-start justify-between gap-4 mb-3">
              <h4 class="font-bold text-gray-800 text-sm">${item.title}</h4>
              ${statusBadge}
            </div>
            <textarea 
              id="archive-textarea-${item.id}"
              rows="4"
              class="w-full p-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D62D20]/20 focus:border-[#D62D20] transition duration-150 resize-y mb-4"
            >${item.content}</textarea>
          </div>
          <div class="border-t border-gray-200 pt-3 mt-2">
            <div class="flex items-center justify-between text-[11px] text-gray-500 mb-4">
              <span>Người gửi: <strong class="text-gray-700">${item.authorName}</strong></span>
              <span>Ngày gửi: ${new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button 
                class="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-archive-update"
                data-id="${item.id}"
              >
                Cập nhật & Duyệt lại
              </button>
              <button 
                class="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-archive-pending"
                data-id="${item.id}"
              >
                Chuyển thành Chờ duyệt
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Gán sự kiện click cập nhật & duyệt lại
    archiveContainer.querySelectorAll(".btn-archive-update").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const textarea = document.getElementById(`archive-textarea-${id}`);
        const contentVal = textarea ? textarea.value.trim() : "";
        if (contentVal === "") {
          alert("Nội dung bài viết không được để trống.");
          return;
        }
        await processArchive(id, 'approved', contentVal);
      });
    });

    // Gán sự kiện click chuyển thành chờ duyệt
    archiveContainer.querySelectorAll(".btn-archive-pending").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const textarea = document.getElementById(`archive-textarea-${id}`);
        const contentVal = textarea ? textarea.value.trim() : "";
        if (contentVal === "") {
          alert("Nội dung bài viết không được để trống.");
          return;
        }
        await processArchive(id, 'pending', contentVal);
      });
    });

  } catch (error) {
    console.error("Lỗi khi tải kho lưu trữ:", error);
    archiveContainer.innerHTML = `<div class="col-span-full text-center text-red-600 py-10">Lỗi khi tải dữ liệu kho lưu trữ.</div>`;
  }
}

async function processArchive(id, status, content) {
  const card = document.getElementById(`archive-card-${id}`);
  
  try {
    if (card) {
      card.style.opacity = 0.5;
      card.style.pointerEvents = 'none';
    }

    const success = await updateContribution(id, status, content);
    
    if (success) {
      // Tải lại cả danh sách chờ duyệt và kho lưu trữ
      await loadPendingContributions();
      await loadArchivedContributions();
      alert(status === 'approved' ? "Cập nhật nội dung và duyệt lại bài thành công!" : "Đã cập nhật nội dung và chuyển bài về hàng chờ duyệt.");
    } else {
      alert("Không thể cập nhật bài viết lưu trữ.");
      if (card) {
        card.style.opacity = 1;
        card.style.pointerEvents = 'auto';
      }
    }
  } catch (error) {
    console.error("Lỗi khi xử lý bài viết lưu trữ:", error);
    alert(`Thao tác thất bại: ${error.message}`);
    if (card) {
      card.style.opacity = 1;
      card.style.pointerEvents = 'auto';
    }
  }
}
