import { getDigitalBooks, getApprovedContributions, addContribution } from './firebase-db.js';

// Dữ liệu triển lãm ảo 360°
const EXHIBITION_DATA = {
  "ben-nha-rong": {
    title: "Triển lãm thực tế ảo Bến Nhà Rồng - Điểm hẹn lịch sử",
    url: "https://www.youtube.com/embed/Pj1aK6nK478?rel=0&enablejsapi=1",
    description: "Khám phá di tích lịch sử Bến Nhà Rồng qua công nghệ hình ảnh 360°, đưa người xem tham quan toàn bộ kiến trúc cảng Sài Gòn xưa và bảo tàng trưng bày di vật của Bác Hồ."
  },
  "bao-tang-hcm": {
    title: "Tham quan ảo 3D Bảo tàng Hồ Chí Minh",
    url: "https://www.youtube.com/embed/z44qgYl3G3g?rel=0&enablejsapi=1",
    description: "Hệ thống triển lãm chuyên đề, tái hiện chân thực cuộc đời cách mạng của Bác Hồ bằng cách hiển thị không gian ba chiều đa phương tiện độc đáo."
  },
  "thu-vien-so": {
    title: "Không gian trải nghiệm Tủ sách điện tử 3D",
    url: "https://www.youtube.com/embed/S_8qC8L18Hw?rel=0&enablejsapi=1",
    description: "Khám phá không gian thư viện số ảo 3D chuyên đề Hồ Chí Minh, nơi độc giả có thể click trực quan vào từng kệ sách và mở rộng trích đoạn tác phẩm đọc thử."
  }
};

// Dữ liệu dòng thời gian "Hành trình di sản Chủ tịch Hồ Chí Minh"
const TIMELINE_DATA = [
  {
    year: "1890",
    title: "Ngày sinh Chủ tịch Hồ Chí Minh",
    location: "Kim Liên, Nam Đàn, Nghệ An",
    description: "Sinh ngày 19/5/1890 với tên khai sinh là Nguyễn Sinh Cung. Người lớn lên trong một gia đình nhà nho yêu nước, tại vùng quê có truyền thống đấu tranh kiên cường chống ách thống trị của thực dân Pháp.",
    details: "Thuở nhỏ, Người được nuôi dưỡng bởi lòng nhân ái của người mẹ, tư tưởng yêu nước của người cha và tinh thần quật khởi của quê hương Nghệ An. Đây là cái nôi hình thành lòng yêu nước thương dân sâu sắc của Người."
  },
  {
    year: "1911",
    title: "Ra đi tìm đường cứu nước",
    location: "Bến Nhà Rồng, Sài Gòn",
    description: "Ngày 5/6/1911, người thanh niên yêu nước Nguyễn Tất Thành lấy tên Văn Ba, xuống tàu Amiral Latouche-Tréville ra đi tìm đường giải phóng dân tộc.",
    details: "Bắt đầu cuộc hành trình bôn ba khắp các đại dương và lục địa kéo dài 30 năm. Quyết định ra đi của Người xuất phát từ sự thấu hiểu nỗi khổ cực của nhân dân dưới ách áp bức và sự thất bại của các phong trào yêu nước tiền bối."
  },
  {
    year: "1920",
    title: "Tìm ra con đường cứu nước và thành lập Đảng Cộng sản Pháp",
    location: "Tours, Pháp",
    description: "Tháng 12/1920, Nguyễn Ái Quốc tham dự Đại hội lần thứ 18 của Đảng Xã hội Pháp ở Tours và bỏ phiếu tán thành gia nhập Quốc tế thứ ba, đồng sáng lập Đảng Cộng sản Pháp.",
    details: "Sự kiện này đánh dấu bước ngoặt quyết định trong cuộc đời hoạt động cách mạng của Người: từ chủ nghĩa yêu nước chân chính đến với chủ nghĩa Mác-Lênin, xác định con đường giải phóng dân tộc theo con đường cách mạng vô sản."
  },
  {
    year: "1930",
    title: "Sáng lập Đảng Cộng sản Việt Nam",
    location: "Cửu Long, Hương Cảng, Trung Quốc",
    description: "Từ ngày 6/1 đến 7/2/1930, Nguyễn Ái Quốc chủ trì Hội nghị thống nhất các tổ chức cộng sản, thành lập Đảng Cộng sản Việt Nam.",
    details: "Việc thành lập Đảng với Cương lĩnh chính trị đầu tiên do Người soạn thảo đã chấm dứt cuộc khủng hoảng kéo dài về đường lối và tổ chức lãnh đạo của cách mạng Việt Nam, mở ra kỷ nguyên mới cho cuộc đấu tranh giành độc lập."
  },
  {
    year: "1941",
    title: "Trở về Tổ quốc trực tiếp lãnh đạo Cách mạng",
    location: "Pác Bó, Hà Quảng, Cao Bằng",
    description: "Ngày 28/1/1941, sau 30 năm hoạt động ở nước ngoài, Nguyễn Ái Quốc trở về nước, trực tiếp lãnh đạo phong trào giải phóng dân tộc.",
    details: "Người triệu tập Hội nghị Trung ương 8, thành lập Mặt trận Việt Minh, thành lập Đội Việt Nam Tuyên truyền Giải phóng quân (tiền thân của Quân đội nhân dân Việt Nam), chuẩn bị lực lượng tổng khởi nghĩa."
  },
  {
    year: "1945",
    title: "Đọc Bản Tuyên ngôn Độc lập",
    location: "Quảng trường Ba Đình, Hà Nội",
    description: "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh thay mặt Chính phủ Lâm thời đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.",
    details: "Bản tuyên ngôn khẳng định trước thế giới quyền độc lập tự do thiêng liêng của dân tộc Việt Nam. Người tuyên bố: 'Nước Việt Nam có quyền hưởng tự do và độc lập, và sự thật đã thành một nước tự do độc lập. Toàn thể dân tộc Việt Nam quyết đem tất cả tinh thần và lực lượng, tính mạng và của cải để giữ vững quyền tự do độc lập ấy'."
  },
  {
    year: "1969",
    title: "Người đi vào cõi vĩnh hằng",
    location: "Hà Nội",
    description: "Chủ tịch Hồ Chí Minh qua đời ngày 2/9/1969, để lại bản Di chúc thiêng liêng và niềm tiếc thương vô hạn cho toàn Đảng, toàn dân ta.",
    details: "Di chúc của Người là một văn kiện lịch sử quý giá, kết tinh tư tưởng, đạo đức, phong cách và tâm hồn cao đẹp của một lãnh tụ thiên tài, suốt đời phục vụ Tổ quốc và nhân dân."
  }
];

function init() {
  initExhibition();
  initTimeline();
  loadBooks();
  loadApprovedContributions();
  initContributionForm();
  initModals();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// 1. Logic Dòng thời gian (Timeline)
function initTimeline() {
  const timelineNav = document.getElementById("timeline-nav");
  const timelineContent = document.getElementById("timeline-content-card");

  if (!timelineNav || !timelineContent) return;

  // Render các nút năm trên timeline
  timelineNav.innerHTML = TIMELINE_DATA.map((item, idx) => `
    <button 
      class="timeline-node flex flex-col items-center focus:outline-none cursor-pointer group z-10" 
      data-index="${idx}"
    >
      <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#D62D20] bg-white group-hover:bg-[#FFD700] transition duration-300 font-bold text-sm text-[#D62D20] shadow-md node-dot">
        ${item.year}
      </div>
      <span class="text-xs font-semibold mt-2 text-gray-600 group-hover:text-[#D62D20] transition duration-300">${item.year}</span>
    </button>
  `).join('');

  // Thêm đường kẻ nền nằm ngang
  const line = document.createElement('div');
  line.className = "absolute h-1 bg-gradient-to-r from-[#D62D20] to-[#FFD700] top-5 left-8 right-8 -z-0 rounded";
  timelineNav.style.position = 'relative';
  timelineNav.appendChild(line);

  // Thêm sự kiện click
  const nodes = document.querySelectorAll(".timeline-node");
  nodes.forEach(node => {
    node.addEventListener("click", (e) => {
      const index = parseInt(node.getAttribute("data-index"));
      showTimelineDetail(index);
    });
  });

  // Hiển thị mốc đầu tiên mặc định
  showTimelineDetail(0);
}

function showTimelineDetail(index) {
  const data = TIMELINE_DATA[index];
  const timelineContent = document.getElementById("timeline-content-card");
  const nodes = document.querySelectorAll(".timeline-node");

  // Cập nhật trạng thái active của các nút năm
  nodes.forEach((node, idx) => {
    const dot = node.querySelector(".node-dot");
    if (idx === index) {
      dot.classList.remove("bg-white", "text-[#D62D20]", "border-[#D62D20]");
      dot.classList.add("bg-[#FFD700]", "text-[#D62D20]", "border-[#FFD700]", "scale-110", "shadow-lg");
    } else {
      dot.classList.add("bg-white", "text-[#D62D20]", "border-[#D62D20]");
      dot.classList.remove("bg-[#FFD700]", "text-[#D62D20]", "border-[#FFD700]", "scale-110", "shadow-lg");
    }
  });

  // Hiệu ứng mượt mà đổi nội dung
  timelineContent.style.opacity = 0;
  timelineContent.style.transform = "translateY(10px)";
  
  setTimeout(() => {
    timelineContent.innerHTML = `
      <div class="p-6 md:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <span class="px-4 py-1 bg-[#D62D20] text-white text-sm font-bold rounded-full shadow-sm">
            Năm ${data.year}
          </span>
          <span class="text-sm font-medium text-gray-500 flex items-center">
            <svg class="w-4 h-4 mr-1 text-[#D62D20]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Địa điểm: ${data.location}
          </span>
        </div>
        <h3 class="text-xl md:text-2xl font-bold text-gray-800 mb-3">${data.title}</h3>
        <p class="text-gray-700 leading-relaxed font-medium mb-4 text-base">${data.description}</p>
        <p class="text-gray-600 text-sm italic bg-gray-50 p-4 border-l-4 border-[#FFD700] rounded-r-lg">${data.details}</p>
      </div>
    `;
    timelineContent.style.opacity = 1;
    timelineContent.style.transform = "translateY(0)";
  }, 200);
}

// 2. Logic Tủ sách số
async function loadBooks() {
  const booksContainer = document.getElementById("books-container");
  if (!booksContainer) return;

  try {
    booksContainer.innerHTML = `
      <div class="col-span-full flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;
    const books = await getDigitalBooks();
    
    if (books.length === 0) {
      booksContainer.innerHTML = `
        <div class="col-span-full text-center text-gray-500 py-10">
          Chưa có sách nào trong tủ sách của Chi bộ.
        </div>
      `;
      return;
    }

    booksContainer.innerHTML = books.map(book => `
      <div class="glass-card rounded-xl overflow-hidden shadow-sm flex flex-col justify-between h-full bg-white">
        <div class="p-6">
          <div class="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-[#D62D20]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h4 class="text-lg font-bold text-gray-800 mb-1 line-clamp-2">${book.bookTitle}</h4>
          <p class="text-sm font-semibold text-gray-500 mb-3">Tác giả: ${book.author}</p>
          <p class="text-sm text-gray-600 line-clamp-3 mb-4">${book.summary}</p>
        </div>
        <div class="p-6 pt-0">
          <button 
            class="w-full py-2 px-4 bg-gray-50 hover:bg-[#FFD700] hover:text-[#D62D20] text-gray-700 font-semibold rounded-lg text-sm transition duration-300 border border-gray-100 flex items-center justify-center gap-2 cursor-pointer btn-read-book"
            data-title="${book.bookTitle}"
            data-author="${book.author}"
            data-summary="${book.summary}"
          >
            Đọc trích đoạn
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Sự kiện mở modal đọc sách
    const readBtns = booksContainer.querySelectorAll(".btn-read-book");
    readBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const title = btn.getAttribute("data-title");
        const author = btn.getAttribute("data-author");
        const summary = btn.getAttribute("data-summary");
        openBookModal(title, author, summary);
      });
    });

  } catch (error) {
    console.error("Lỗi khi tải tủ sách:", error);
    booksContainer.innerHTML = `<div class="col-span-full text-center text-red-600 py-10">Lỗi khi kết nối dữ liệu. Vui lòng tải lại trang.</div>`;
  }
}

function openBookModal(title, author, summary) {
  const modal = document.getElementById("book-modal");
  const modalTitle = document.getElementById("modal-book-title");
  const modalAuthor = document.getElementById("modal-book-author");
  const modalSummary = document.getElementById("modal-book-summary");

  if (!modal || !modalTitle || !modalAuthor || !modalSummary) return;

  modalTitle.textContent = title;
  modalAuthor.textContent = `Tác giả: ${author}`;
  // Hỗ trợ hiển thị xuống dòng tốt hơn
  modalSummary.innerHTML = summary.replace(/\n/g, '<br>');

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

// 3. Đề xuất, đóng góp công khai
async function loadApprovedContributions() {
  const goldenBookContainer = document.getElementById("golden-book-container");
  if (!goldenBookContainer) return;

  try {
    goldenBookContainer.innerHTML = `
      <div class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D62D20]"></div>
      </div>
    `;
    const contributions = await getApprovedContributions();

    if (contributions.length === 0) {
      goldenBookContainer.innerHTML = `
        <div class="text-center text-gray-500 py-10">
          Chưa có bài viết đóng góp nào được duyệt công khai. Hãy gửi bài đầu tiên bên dưới!
        </div>
      `;
      return;
    }

    goldenBookContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${contributions.map(item => `
          <div class="bg-[#FFFDF9] border border-orange-100 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FFD700]/10 to-transparent -z-0 rounded-bl-full pointer-events-none"></div>
            <div>
              <div class="flex justify-between items-start gap-4 mb-3">
                <h5 class="text-lg font-bold text-gray-800">${item.title}</h5>
                <span class="text-yellow-500 text-lg">★</span>
              </div>
              <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed mb-6">${item.content}</p>
            </div>
            <div class="border-t border-dashed border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
              <span class="font-bold text-[#D62D20] bg-red-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                Người viết: ${item.authorName}
              </span>
              <span>${new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error("Lỗi khi tải đề xuất, đóng góp:", error);
    goldenBookContainer.innerHTML = `<div class="text-center text-red-600 py-10">Lỗi khi kết nối dữ liệu.</div>`;
  }
}

// 4. Form đóng góp tư liệu
function initContributionForm() {
  const form = document.getElementById("contribution-form");
  const submitBtn = document.getElementById("btn-submit-contribution");
  const toast = document.getElementById("toast-success");

  if (!form || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("contrib-title").value.trim();
    const authorName = document.getElementById("contrib-author").value.trim();
    const content = document.getElementById("contrib-content").value.trim();

    if (!title || !content) {
      alert("Vui lòng điền tiêu đề và nội dung đóng góp.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Đang gửi về Chi bộ...
      `;

      await addContribution(title, authorName, content);

      form.reset();

      // Hiển thị thông báo Toast
      if (toast) {
        toast.classList.remove("hidden");
        setTimeout(() => {
          toast.classList.add("hidden");
        }, 5000);
      } else {
        alert("Gửi bài viết về Chi bộ thành công! Bài viết của bạn sẽ được hiển thị trên Đề xuất, đóng góp công khai sau khi Ban quản trị duyệt.");
      }

    } catch (error) {
      console.error("Lỗi khi gửi đóng góp:", error);
      alert("Gửi bài thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi về Chi bộ";
    }
  });
}

// 5. Khởi tạo Modals
function initModals() {
  const bookModal = document.getElementById("book-modal");
  const closeBookBtn = document.getElementById("close-book-modal");

  if (bookModal && closeBookBtn) {
    const closeModal = () => {
      bookModal.classList.add("hidden");
      bookModal.classList.remove("flex");
      document.body.classList.remove("overflow-hidden");
    };

    closeBookBtn.addEventListener("click", closeModal);
    
    // Đóng khi click ngoài vùng modal-content
    bookModal.addEventListener("click", (e) => {
      if (e.target === bookModal) {
        closeModal();
      }
    });

    // Phím ESC đóng modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !bookModal.classList.contains("hidden")) {
        closeModal();
      }
    });
  }

  // Nút đóng Toast nhanh
  const closeToastBtn = document.getElementById("close-toast");
  const toast = document.getElementById("toast-success");
  if (closeToastBtn && toast) {
    closeToastBtn.addEventListener("click", () => {
      toast.classList.add("hidden");
    });
  }
}

// Logic Triển lãm số 360°
function initExhibition() {
  const iframe = document.getElementById("exhibition-iframe");
  const titleDisplay = document.getElementById("exhibition-title");
  const descDisplay = document.getElementById("exhibition-desc");
  const buttonsContainer = document.getElementById("exhibition-buttons-container");

  if (!iframe || !titleDisplay || !descDisplay || !buttonsContainer) return;

  const buttons = buttonsContainer.querySelectorAll(".btn-exhibition");

  function switchExhibition(key) {
    const data = EXHIBITION_DATA[key];
    if (!data) return;

    // Hiệu ứng chuyển cảnh mượt mà cho iframe
    iframe.style.opacity = 0;
    iframe.style.transform = "scale(0.98)";
    iframe.style.transition = "all 0.3s ease";

    setTimeout(() => {
      iframe.src = data.url;
      titleDisplay.textContent = data.title;
      descDisplay.textContent = data.description;
      
      iframe.style.opacity = 1;
      iframe.style.transform = "scale(1)";
    }, 250);

    // Cập nhật trạng thái nút được chọn bằng Tailwind
    buttons.forEach(btn => {
      const btnKey = btn.getAttribute("data-key");
      if (btnKey === key) {
        btn.className = "px-5 py-2.5 rounded-xl text-xs font-bold transition duration-300 shadow-md border border-[#D62D20] bg-[#D62D20] text-white scale-105 cursor-pointer btn-exhibition";
      } else {
        btn.className = "px-5 py-2.5 rounded-xl text-xs font-bold transition duration-300 shadow-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer btn-exhibition";
      }
    });
  }

  // Lắng nghe sự kiện click trên các nút
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      switchExhibition(key);
    });
  });

  // Phát chủ đề đầu tiên mặc định
  switchExhibition("ben-nha-rong");
}
