import { getReferenceDocuments } from './firebase-db.js';

// Danh sách tài liệu toàn cục
let loadedDocuments = [];

// Khởi tạo trang
function init() {
  loadReferenceDocs();
  initDetailViewEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// 1. Tải danh sách tài liệu tham khảo
async function loadReferenceDocs() {
  const container = document.getElementById("references-container");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="col-span-full flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;

    loadedDocuments = await getReferenceDocuments();

    if (loadedDocuments.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center text-gray-500 py-10">
          Chưa có tài liệu tham khảo nào được đăng tải.
        </div>
      `;
      return;
    }

    container.innerHTML = loadedDocuments.map(doc => {
      // Trích xuất hình ảnh nếu có, không có thì lấy ảnh mặc định trang nghiêm
      const imgPath = doc.imageUrl && doc.imageUrl.trim() !== "" 
        ? doc.imageUrl 
        : "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600";

      return `
        <div class="glass-card rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between h-full border border-gray-150">
          <div>
            <!-- Ảnh đại diện -->
            <div class="h-44 overflow-hidden bg-gray-100 relative">
              <img src="${imgPath}" alt="${doc.title}" class="w-full h-full object-cover hover:scale-105 transition duration-500">
              <span class="absolute bottom-3 left-3 bg-[#D62D20] text-[#FFD700] text-[10px] font-extrabold px-2.5 py-1 rounded shadow-md uppercase">Tài liệu</span>
            </div>
            
            <div class="p-5">
              <span class="text-[10px] font-bold text-gray-400 block mb-1">
                Đăng bởi: ${doc.author} • ${new Date(doc.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <h3 
                class="text-base font-bold text-gray-800 hover:text-[#D62D20] cursor-pointer line-clamp-2 transition mb-2 btn-open-detail"
                data-id="${doc.id}"
              >
                ${doc.title}
              </h3>
              <p class="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                ${doc.summary}
              </p>
            </div>
          </div>

          <div class="p-5 pt-0">
            <button 
              class="w-full py-2 bg-red-50 hover:bg-[#FFD700] hover:text-[#D62D20] text-[#D62D20] font-bold rounded-xl text-xs transition duration-300 flex items-center justify-center gap-1 cursor-pointer btn-open-detail"
              data-id="${doc.id}"
            >
              Đọc tài liệu
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Đăng ký sự kiện click mở xem chi tiết
    container.querySelectorAll(".btn-open-detail").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        showDocumentDetail(id);
      });
    });

  } catch (error) {
    console.error("Lỗi nạp tài liệu tham khảo:", error);
    container.innerHTML = `
      <div class="col-span-full text-center text-red-600 py-10">
        Lỗi hệ thống khi tải tài liệu tham khảo. Vui lòng tải lại trang.
      </div>
    `;
  }
}

// 2. Hiển thị chi tiết một tài liệu (Full Page inline)
function showDocumentDetail(id) {
  const doc = loadedDocuments.find(d => d.id === id);
  if (!doc) return;

  const listView = document.getElementById("references-list-view");
  const detailView = document.getElementById("reference-detail-view");

  const dTitle = document.getElementById("detail-title");
  const dAuthor = document.getElementById("detail-author");
  const dDate = document.getElementById("detail-date");
  const dSummary = document.getElementById("detail-summary");
  const dContent = document.getElementById("detail-content");
  
  const dImgContainer = document.getElementById("detail-image-container");
  const dImg = document.getElementById("detail-image");
  
  const dVideoContainer = document.getElementById("detail-video-container");
  const dVideoIframe = document.getElementById("detail-video-iframe");

  if (!listView || !detailView || !dTitle || !dAuthor || !dDate || !dSummary || !dContent) return;

  // Điền dữ liệu
  dTitle.textContent = doc.title;
  dAuthor.textContent = doc.author;
  dDate.textContent = new Date(doc.createdAt).toLocaleDateString('vi-VN') + ' ' + new Date(doc.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  dSummary.textContent = doc.summary;
  
  // Hỗ trợ hiển thị ngắt dòng trong nội dung
  dContent.innerHTML = doc.content.split('\n').map(p => `<p class="leading-relaxed text-sm mb-4 text-gray-700">${p}</p>`).join('');

  // Xử lý hình ảnh
  if (doc.imageUrl && doc.imageUrl.trim() !== "") {
    dImg.src = doc.imageUrl;
    dImgContainer.classList.remove("hidden");
  } else {
    dImg.src = "";
    dImgContainer.classList.add("hidden");
  }

  // Xử lý Video (tự động đổi link YouTube thông thường sang dạng /embed/)
  if (doc.videoUrl && doc.videoUrl.trim() !== "") {
    let cleanVideoUrl = doc.videoUrl.trim();
    if (cleanVideoUrl.includes("youtube.com/watch?v=")) {
      const videoId = cleanVideoUrl.split("watch?v=")[1].split("&")[0];
      cleanVideoUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
    } else if (cleanVideoUrl.includes("youtu.be/")) {
      const videoId = cleanVideoUrl.split("youtu.be/")[1].split("?")[0];
      cleanVideoUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
    
    dVideoIframe.src = cleanVideoUrl;
    dVideoContainer.classList.remove("hidden");
  } else {
    dVideoIframe.src = "";
    dVideoContainer.classList.add("hidden");
  }

  // Chuyển màn hình
  listView.classList.add("hidden");
  detailView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 3. Khởi tạo sự kiện nút Quay lại danh sách
function initDetailViewEvents() {
  const backBtn = document.getElementById("btn-back-to-list");
  const listView = document.getElementById("references-list-view");
  const detailView = document.getElementById("reference-detail-view");
  const dVideoIframe = document.getElementById("detail-video-iframe");

  if (backBtn && listView && detailView) {
    backBtn.addEventListener("click", () => {
      // Dừng video đang phát ngầm bằng cách reset src
      if (dVideoIframe) {
        dVideoIframe.src = "";
      }
      detailView.classList.add("hidden");
      listView.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
