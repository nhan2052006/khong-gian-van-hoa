import { 
  login, 
  logout, 
  onAuthStateChange, 
  getPendingContributions, 
  updateContribution,
  updateContributionFull,
  deleteContribution,
  getArchivedContributions,
  getDigitalBooks,
  addDigitalBook,
  updateDigitalBook,
  deleteDigitalBook,
  getReferenceDocuments,
  addReferenceDocument,
  updateReferenceDocument,
  deleteReferenceDocument,
  isSimulation 
} from './firebase-db.js';

// Khởi tạo và liên kết sự kiện khi trang đã tải
function init() {
  initAdminAuth();
  initDashboardForms();
  initModals();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Helper tự động chuẩn hóa link YouTube thông thường sang dạng nhúng /embed/
function sanitizeYouTubeEmbedUrl(url) {
  if (!url || url.trim() === "") return "";
  let cleanUrl = url.trim();
  if (cleanUrl.includes("youtube.com/watch?v=")) {
    const videoId = cleanUrl.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  } else if (cleanUrl.includes("youtu.be/")) {
    const videoId = cleanUrl.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  }
  return cleanUrl;
}

// ==========================================
// 1. QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP & XÁC THỰC
// ==========================================
function initAdminAuth() {
  const loginSection = document.getElementById("login-section");
  const dashboardSection = document.getElementById("dashboard-section");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("btn-logout");
  const loginError = document.getElementById("login-error");
  const adminEmailDisplay = document.getElementById("admin-email-display");
  const simNotice = document.getElementById("simulation-notice");

  // Hiển thị chỉ dẫn nếu ở chế độ Giả lập
  if (simNotice && isSimulation()) {
    simNotice.classList.remove("hidden");
  }

  // Lắng nghe Auth State
  onAuthStateChange((user) => {
    if (user) {
      loginSection.classList.add("hidden");
      dashboardSection.classList.remove("hidden");
      if (adminEmailDisplay) {
        adminEmailDisplay.textContent = `Tài khoản: ${user.email} ${isSimulation() ? '(Giả lập)' : ''}`;
      }
      // Tải toàn bộ dữ liệu quản trị
      loadPendingContributions();
      loadArchivedContributions();
      loadBooks();
      loadReferenceDocsAdmin();
    } else {
      loginSection.classList.remove("hidden");
      dashboardSection.classList.add("hidden");
    }
  });

  // Gửi Form Đăng nhập
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
        let friendlyMsg = "Tên đăng nhập hoặc mật khẩu không chính xác.";
        
        if (error.code) {
          switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
              friendlyMsg = "Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại!";
              break;
            case "auth/invalid-email":
              friendlyMsg = "Định dạng Email không hợp lệ!";
              break;
            case "auth/user-not-found":
              friendlyMsg = "Tài khoản này không tồn tại trên hệ thống!";
              break;
            default:
              if (error.code.includes("invalid") || error.code.includes("credential") || error.code.includes("password")) {
                friendlyMsg = "Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại!";
              } else {
                friendlyMsg = "Đã xảy ra lỗi hệ thống: " + error.message;
              }
          }
        } else if (error.message) {
          friendlyMsg = "Đã xảy ra lỗi hệ thống: " + error.message;
        }
        
        showError(friendlyMsg);
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

// ==========================================
// 2. BIỂU MẪU & LẮNG NGHE SỰ KIỆN TẢI LẠI
// ==========================================
function initDashboardForms() {
  const bookForm = document.getElementById("add-book-form");
  const submitBookBtn = document.getElementById("btn-submit-book");
  const bookSuccessAlert = document.getElementById("book-success-alert");
  
  const refForm = document.getElementById("add-ref-form");
  const submitRefBtn = document.getElementById("btn-submit-ref");
  const refSuccessAlert = document.getElementById("ref-success-alert");

  const refreshBooksBtn = document.getElementById("btn-refresh-books");
  const refreshArchiveBtn = document.getElementById("btn-refresh-archive");
  const refreshRefsBtn = document.getElementById("btn-refresh-refs");

  // Nút tải lại Tủ sách
  if (refreshBooksBtn) {
    refreshBooksBtn.addEventListener("click", () => {
      loadBooks();
    });
  }

  // Nút tải lại Kho lưu trữ
  if (refreshArchiveBtn) {
    refreshArchiveBtn.addEventListener("click", () => {
      loadArchivedContributions();
    });
  }

  // Nút tải lại Tài liệu tham khảo
  if (refreshRefsBtn) {
    refreshRefsBtn.addEventListener("click", () => {
      loadReferenceDocsAdmin();
    });
  }

  // Thêm sách mới
  if (bookForm) {
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

        if (bookSuccessAlert) {
          bookSuccessAlert.classList.remove("hidden");
          setTimeout(() => {
            bookSuccessAlert.classList.add("hidden");
          }, 3000);
        }

        // Tải lại tủ sách quản lý
        loadBooks();

      } catch (error) {
        console.error("Lỗi khi thêm sách:", error);
        alert("Lỗi hệ thống, không thể thêm sách lúc này.");
      } finally {
        submitBookBtn.disabled = false;
        submitBookBtn.textContent = "Thêm vào tủ sách";
      }
    });
  }

  // Thêm tài liệu tham khảo mới
  if (refForm) {
    refForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("ref-title").value.trim();
      const author = document.getElementById("ref-author").value.trim();
      const imageUrl = document.getElementById("ref-image-url").value.trim();
      const rawVideoUrl = document.getElementById("ref-video-url").value.trim();
      const summary = document.getElementById("ref-summary").value.trim();
      const content = document.getElementById("ref-content").value.trim();

      if (!title || !author || !summary || !content) {
        alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
        return;
      }

      // Chuẩn hóa link video nhúng YouTube
      const videoUrl = sanitizeYouTubeEmbedUrl(rawVideoUrl);

      try {
        submitRefBtn.disabled = true;
        submitRefBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang tạo tài liệu...
        `;

        await addReferenceDocument(title, author, summary, content, imageUrl, videoUrl);
        refForm.reset();

        if (refSuccessAlert) {
          refSuccessAlert.classList.remove("hidden");
          setTimeout(() => {
            refSuccessAlert.classList.add("hidden");
          }, 3000);
        }

        // Tải lại danh sách quản lý
        loadReferenceDocsAdmin();

      } catch (error) {
        console.error("Lỗi khi thêm tài liệu tham khảo:", error);
        alert("Lỗi hệ thống, không thể tạo tài liệu lúc này.");
      } finally {
        submitRefBtn.disabled = false;
        submitRefBtn.textContent = "Tạo tài liệu mới";
      }
    });
  }
}

// ==========================================
// 3. QUẢN LÝ BÀI ĐÓNG GÓP (DUYỆT & LƯU TRỮ)
// ==========================================

// Tải danh sách bài viết chờ duyệt
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
            <h4 class="font-bold text-gray-800 text-base" id="pending-title-text-${item.id}">${item.title}</h4>
            <span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Chờ duyệt</span>
          </div>
          <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nội dung đóng góp (Có thể sửa tại đây):</label>
          <textarea 
            id="pending-textarea-${item.id}"
            rows="4"
            class="w-full p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D62D20]/20 focus:border-[#D62D20] transition duration-150 resize-y mb-4"
          >${item.content}</textarea>
        </div>
        <div class="border-t border-gray-100 pt-3 mt-2">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>Người gửi: <strong class="text-gray-700" id="pending-author-text-${item.id}">${item.authorName}</strong></span>
            <span>Gửi lúc: ${new Date(item.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button 
              class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-approve"
              data-id="${item.id}"
            >
              Duyệt đăng
            </button>
            <button 
              class="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-reject"
              data-id="${item.id}"
            >
              Từ chối
            </button>
            <button 
              class="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-edit-contrib"
              data-id="${item.id}"
              data-title="${item.title}"
              data-author="${item.authorName}"
              data-status="${item.status}"
            >
              Sửa
            </button>
            <button 
              class="py-2 px-3 bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-500 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-delete-contrib"
              data-id="${item.id}"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Bắt sự kiện click
    bindContributionActions(pendingContainer);

  } catch (error) {
    console.error("Lỗi khi tải danh sách chờ duyệt:", error);
    pendingContainer.innerHTML = `<div class="text-center text-red-600 py-10">Lỗi khi kết nối dữ liệu.</div>`;
  }
}

// Tải danh sách bài viết lưu trữ (Kho lưu trữ)
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
              <h4 class="font-bold text-gray-800 text-sm" id="archive-title-text-${item.id}">${item.title}</h4>
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
              <span>Người gửi: <strong class="text-gray-700" id="archive-author-text-${item.id}">${item.authorName}</strong></span>
              <span>Ngày gửi: ${new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button 
                class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-archive-update"
                data-id="${item.id}"
              >
                Cập nhật & Duyệt lại
              </button>
              <button 
                class="flex-1 py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-archive-pending"
                data-id="${item.id}"
              >
                Chờ duyệt
              </button>
              <button 
                class="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-edit-contrib"
                data-id="${item.id}"
                data-title="${item.title}"
                data-author="${item.authorName}"
                data-status="${item.status}"
              >
                Sửa
              </button>
              <button 
                class="py-2 px-3 bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-500 font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer btn-delete-contrib"
                data-id="${item.id}"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bắt sự kiện click
    bindContributionActions(archiveContainer);

  } catch (error) {
    console.error("Lỗi khi tải kho lưu trữ:", error);
    archiveContainer.innerHTML = `<div class="col-span-full text-center text-red-600 py-10">Lỗi khi tải dữ liệu kho lưu trữ.</div>`;
  }
}

// Ràng buộc các sự kiện hành động cho bài đóng góp
function bindContributionActions(container) {
  // Nút duyệt đăng
  container.querySelectorAll(".btn-approve, .btn-archive-update").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const textarea = document.getElementById(`pending-textarea-${id}`) || document.getElementById(`archive-textarea-${id}`);
      const contentVal = textarea ? textarea.value.trim() : null;
      await processContribution(id, 'approved', contentVal);
    });
  });

  // Nút từ chối
  container.querySelectorAll(".btn-reject").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const textarea = document.getElementById(`pending-textarea-${id}`);
      const contentVal = textarea ? textarea.value.trim() : null;
      if (confirm("Bạn có chắc muốn từ chối bài viết đóng góp này?")) {
        await processContribution(id, 'rejected', contentVal);
      }
    });
  });

  // Nút trả về chờ duyệt
  container.querySelectorAll(".btn-archive-pending").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const textarea = document.getElementById(`archive-textarea-${id}`);
      const contentVal = textarea ? textarea.value.trim() : null;
      await processContribution(id, 'pending', contentVal);
    });
  });

  // Nút Xóa bài đóng góp
  container.querySelectorAll(".btn-delete-contrib").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN bài đóng góp này khỏi cơ sở dữ liệu? Thao tác này không thể hoàn tác.")) {
        await handleDeleteContribution(id);
      }
    });
  });

  // Nút Sửa mở Modal
  container.querySelectorAll(".btn-edit-contrib").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      const author = btn.getAttribute("data-author");
      const status = btn.getAttribute("data-status");
      
      const textarea = document.getElementById(`pending-textarea-${id}`) || document.getElementById(`archive-textarea-${id}`);
      const content = textarea ? textarea.value : "";
      
      openEditContribModal({ id, title, authorName: author, content, status });
    });
  });
}

// Xử lý Phê duyệt / Từ chối / Đổi trạng thái bài viết
async function processContribution(id, status, content = null) {
  try {
    const success = await updateContribution(id, status, content);
    if (success) {
      loadPendingContributions();
      loadArchivedContributions();
    } else {
      alert("Không thể cập nhật trạng thái bài viết.");
    }
  } catch (error) {
    console.error("Lỗi khi xử lý bài đóng góp:", error);
    alert(`Thao tác thất bại: ${error.message}`);
  }
}

// Xóa bài đóng góp vĩnh viễn
async function handleDeleteContribution(id) {
  try {
    const success = await deleteContribution(id);
    if (success) {
      alert("Đã xóa vĩnh viễn bài đóng góp khỏi hệ thống.");
      loadPendingContributions();
      loadArchivedContributions();
    } else {
      alert("Xóa bài đóng góp thất bại.");
    }
  } catch (error) {
    console.error("Lỗi khi xóa bài đóng góp:", error);
    alert(`Lỗi hệ thống: ${error.message}`);
  }
}

// ==========================================
// 4. QUẢN LÝ TỦ SÁCH SỐ (HIỂN THỊ, XÓA)
// ==========================================

// Tải danh sách sách để quản lý
async function loadBooks() {
  const booksContainer = document.getElementById("managed-books-container");
  if (!booksContainer) return;

  try {
    booksContainer.innerHTML = `
      <div class="col-span-full flex justify-center py-6">
        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;

    const booksList = await getDigitalBooks();

    if (booksList.length === 0) {
      booksContainer.innerHTML = `
        <p class="col-span-full text-xs text-center text-gray-500 py-6">Tủ sách hiện chưa có tác phẩm nào.</p>
      `;
      return;
    }

    booksContainer.innerHTML = booksList.map(book => `
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-150 flex flex-col justify-between gap-3 shadow-inner" id="book-card-${book.id}">
        <div>
          <h4 class="font-bold text-gray-800 text-sm line-clamp-1" id="book-title-text-${book.id}">${book.bookTitle}</h4>
          <p class="text-xs font-semibold text-[#D62D20] mt-0.5" id="book-author-text-${book.id}">Tác giả: ${book.author}</p>
          <p class="text-xs text-gray-500 mt-2 line-clamp-2" id="book-summary-text-${book.id}">${book.summary}</p>
        </div>
        <div class="flex gap-2 border-t border-gray-200/60 pt-2.5">
          <button 
            class="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition duration-150 cursor-pointer btn-edit-book"
            data-id="${book.id}"
            data-title="${book.bookTitle}"
            data-author="${book.author}"
            data-summary="${book.summary}"
          >
            Sửa
          </button>
          <button 
            class="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-500 font-bold rounded-lg text-xs transition duration-150 cursor-pointer btn-delete-book"
            data-id="${book.id}"
          >
            Xóa
          </button>
        </div>
      </div>
    `).join('');

    // Đăng ký sự kiện click
    booksContainer.querySelectorAll(".btn-delete-book").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Bạn có chắc muốn XÓA VĨNH VIỄN cuốn sách này khỏi Tủ sách điện tử? Độc giả ngoài trang chủ sẽ không thể đọc trích đoạn của nó nữa.")) {
          await handleDeleteBook(id);
        }
      });
    });

    booksContainer.querySelectorAll(".btn-edit-book").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");
        const author = btn.getAttribute("data-author");
        const summary = btn.getAttribute("data-summary");
        
        openEditBookModal({ id, bookTitle: title, author, summary });
      });
    });

  } catch (error) {
    console.error("Lỗi khi tải tủ sách quản lý:", error);
    booksContainer.innerHTML = `<p class="col-span-full text-xs text-center text-red-600 py-6">Lỗi tải dữ liệu tủ sách.</p>`;
  }
}

// Xóa sách vĩnh viễn
async function handleDeleteBook(id) {
  try {
    const success = await deleteDigitalBook(id);
    if (success) {
      alert("Đã xóa cuốn sách thành công khỏi tủ sách Chi bộ.");
      loadBooks();
    } else {
      alert("Không thể xóa sách.");
    }
  } catch (error) {
    console.error("Lỗi khi xóa sách:", error);
    alert(`Lỗi hệ thống: ${error.message}`);
  }
}

// ==========================================
// 5. QUẢN LÝ TÀI LIỆU THAM KHẢO (CRUD MỚI)
// ==========================================

// Tải danh sách tài liệu tham khảo trong Admin
async function loadReferenceDocsAdmin() {
  const refsContainer = document.getElementById("managed-references-container");
  if (!refsContainer) return;

  try {
    refsContainer.innerHTML = `
      <div class="col-span-full flex justify-center py-6">
        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;

    const refsList = await getReferenceDocuments();

    if (refsList.length === 0) {
      refsContainer.innerHTML = `
        <p class="col-span-full text-xs text-center text-gray-500 py-6">Hiện tại chưa có tài liệu tham khảo nào được tạo.</p>
      `;
      return;
    }

    refsContainer.innerHTML = refsList.map(ref => {
      const displayImg = ref.imageUrl && ref.imageUrl.trim() !== "" ? ref.imageUrl : "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=200";
      return `
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-150 flex flex-col justify-between gap-3 shadow-inner" id="ref-card-${ref.id}">
          <div class="flex gap-3">
            <img src="${displayImg}" alt="Avatar" class="w-12 h-12 rounded object-cover border border-gray-200">
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-gray-800 text-xs truncate" title="${ref.title}">${ref.title}</h4>
              <p class="text-[10px] font-semibold text-gray-500 mt-0.5">Tác giả: ${ref.author}</p>
              <p class="text-[10px] text-gray-400 mt-1 truncate">${ref.summary}</p>
            </div>
          </div>
          <div class="flex gap-2 border-t border-gray-200/60 pt-2.5">
            <button 
              class="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition duration-150 cursor-pointer btn-edit-ref"
              data-id="${ref.id}"
              data-title="${ref.title}"
              data-author="${ref.author}"
              data-image-url="${ref.imageUrl}"
              data-video-url="${ref.videoUrl}"
              data-summary="${ref.summary}"
              data-content="${ref.content}"
            >
              Sửa
            </button>
            <button 
              class="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-500 font-bold rounded-lg text-xs transition duration-150 cursor-pointer btn-delete-ref"
              data-id="${ref.id}"
            >
              Xóa
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Đăng ký sự kiện Xóa
    refsContainer.querySelectorAll(".btn-delete-ref").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài liệu tham khảo này? Thao tác này sẽ cập nhật ngay lập tức ra ngoài giao diện đọc tài liệu của Đảng viên.")) {
          await handleDeleteRefDoc(id);
        }
      });
    });

    // Đăng ký sự kiện Sửa mở Modal
    refsContainer.querySelectorAll(".btn-edit-ref").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");
        const author = btn.getAttribute("data-author");
        const imageUrl = btn.getAttribute("data-image-url");
        const videoUrl = btn.getAttribute("data-video-url");
        const summary = btn.getAttribute("data-summary");
        const content = btn.getAttribute("data-content");
        
        openEditRefModal({ id, title, author, imageUrl, videoUrl, summary, content });
      });
    });

  } catch (error) {
    console.error("Lỗi khi tải tài liệu tham khảo quản trị:", error);
    refsContainer.innerHTML = `<p class="col-span-full text-xs text-center text-red-600 py-6">Lỗi tải dữ liệu tài liệu.</p>`;
  }
}

// Xóa tài liệu tham khảo
async function handleDeleteRefDoc(id) {
  try {
    const success = await deleteReferenceDocument(id);
    if (success) {
      alert("Đã xóa tài liệu tham khảo thành công khỏi hệ thống.");
      loadReferenceDocsAdmin();
    } else {
      alert("Không thể xóa tài liệu tham khảo.");
    }
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu tham khảo:", error);
    alert(`Lỗi hệ thống: ${error.message}`);
  }
}

// ==========================================
// 6. CƠ CHẾ ĐIỀU PHỐI POPUP MODAL (EDIT)
// ==========================================
function initModals() {
  const editContribModal = document.getElementById("edit-contrib-modal");
  const editBookModal = document.getElementById("edit-book-modal");
  const editRefModal = document.getElementById("edit-ref-modal");

  const closeContribBtns = [
    document.getElementById("btn-close-edit-contrib"),
    document.getElementById("btn-cancel-edit-contrib")
  ];
  
  const closeBookBtns = [
    document.getElementById("btn-close-edit-book"),
    document.getElementById("btn-cancel-edit-book")
  ];

  const closeRefBtns = [
    document.getElementById("btn-close-edit-ref"),
    document.getElementById("btn-cancel-edit-ref")
  ];

  // Sự kiện đóng Modal đóng góp
  closeContribBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        editContribModal.classList.add("hidden");
        editContribModal.classList.remove("flex");
      });
    }
  });

  // Sự kiện đóng Modal sách
  closeBookBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        editBookModal.classList.add("hidden");
        editBookModal.classList.remove("flex");
      });
    }
  });

  // Sự kiện đóng Modal tài liệu tham khảo
  closeRefBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        editRefModal.classList.add("hidden");
        editRefModal.classList.remove("flex");
      });
    }
  });

  // Lưu Form chỉnh sửa đóng đóng góp
  const editContribForm = document.getElementById("edit-contrib-form");
  if (editContribForm) {
    editContribForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-contrib-id").value;
      const title = document.getElementById("edit-contrib-title").value.trim();
      const author = document.getElementById("edit-contrib-author").value.trim();
      const content = document.getElementById("edit-contrib-content").value.trim();
      const status = document.getElementById("edit-contrib-status").value;

      try {
        const success = await updateContributionFull(id, title, author, content, status);
        if (success) {
          alert("Cập nhật thông tin bài đóng góp thành công!");
          editContribModal.classList.add("hidden");
          editContribModal.classList.remove("flex");
          
          loadPendingContributions();
          loadArchivedContributions();
        } else {
          alert("Cập nhật thất bại.");
        }
      } catch (error) {
        console.error("Lỗi khi lưu bài đóng góp:", error);
        alert(`Lỗi hệ thống: ${error.message}`);
      }
    });
  }

  // Lưu Form chỉnh sửa sách
  const editBookForm = document.getElementById("edit-book-form");
  if (editBookForm) {
    editBookForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-book-id").value;
      const title = document.getElementById("edit-book-title").value.trim();
      const author = document.getElementById("edit-book-author").value.trim();
      const summary = document.getElementById("edit-book-summary").value.trim();

      try {
        const success = await updateDigitalBook(id, title, author, summary);
        if (success) {
          alert("Cập nhật thông tin sách thành công!");
          editBookModal.classList.add("hidden");
          editBookModal.classList.remove("flex");
          
          loadBooks();
        } else {
          alert("Cập nhật thông tin sách thất bại.");
        }
      } catch (error) {
        console.error("Lỗi khi lưu thông tin sách:", error);
        alert(`Lỗi hệ thống: ${error.message}`);
      }
    });
  }

  // Lưu Form chỉnh sửa tài liệu tham khảo
  const editRefForm = document.getElementById("edit-ref-form");
  if (editRefForm) {
    editRefForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-ref-id").value;
      const title = document.getElementById("edit-ref-title").value.trim();
      const author = document.getElementById("edit-ref-author").value.trim();
      const imageUrl = document.getElementById("edit-ref-image-url").value.trim();
      const rawVideoUrl = document.getElementById("edit-ref-video-url").value.trim();
      const summary = document.getElementById("edit-ref-summary").value.trim();
      const content = document.getElementById("edit-ref-content").value.trim();

      // Chuẩn hóa link video
      const videoUrl = sanitizeYouTubeEmbedUrl(rawVideoUrl);

      try {
        const success = await updateReferenceDocument(id, title, author, summary, content, imageUrl, videoUrl);
        if (success) {
          alert("Cập nhật tài liệu tham khảo thành công!");
          editRefModal.classList.add("hidden");
          editRefModal.classList.remove("flex");
          
          loadReferenceDocsAdmin();
        } else {
          alert("Cập nhật thất bại.");
        }
      } catch (error) {
        console.error("Lỗi khi lưu tài liệu tham khảo:", error);
        alert(`Lỗi hệ thống: ${error.message}`);
      }
    });
  }
}

// Mở Modal chỉnh sửa bài đóng góp
function openEditContribModal(item) {
  const modal = document.getElementById("edit-contrib-modal");
  if (!modal) return;

  document.getElementById("edit-contrib-id").value = item.id;
  document.getElementById("edit-contrib-title").value = item.title;
  document.getElementById("edit-contrib-author").value = item.authorName === "Ẩn danh" ? "" : item.authorName;
  document.getElementById("edit-contrib-content").value = item.content;
  document.getElementById("edit-contrib-status").value = item.status;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Mở Modal chỉnh sửa sách
function openEditBookModal(item) {
  const modal = document.getElementById("edit-book-modal");
  if (!modal) return;

  document.getElementById("edit-book-id").value = item.id;
  document.getElementById("edit-book-title").value = item.bookTitle;
  document.getElementById("edit-book-author").value = item.author;
  document.getElementById("edit-book-summary").value = item.summary;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Mở Modal chỉnh sửa tài liệu tham khảo
function openEditRefModal(item) {
  const modal = document.getElementById("edit-ref-modal");
  if (!modal) return;

  document.getElementById("edit-ref-id").value = item.id;
  document.getElementById("edit-ref-title").value = item.title;
  document.getElementById("edit-ref-author").value = item.author;
  document.getElementById("edit-ref-image-url").value = item.imageUrl;
  document.getElementById("edit-ref-video-url").value = item.videoUrl;
  document.getElementById("edit-ref-summary").value = item.summary;
  document.getElementById("edit-ref-content").value = item.content;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}
