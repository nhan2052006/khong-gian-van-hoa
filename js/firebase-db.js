import config from '../antigravity.config.js';

// Khởi tạo các biến Firebase
let app, auth, db;
let isSimulationActive = config.useSimulation;

// Khởi tạo dữ liệu mẫu nếu chạy ở chế độ Giả lập (Simulation Mode)
const DEFAULT_BOOKS = [
  {
    id: "sim-book-1",
    bookTitle: "Đường Kách Mệnh",
    author: "Nguyễn Ái Quốc (Hồ Chí Minh)",
    summary: "Đường Kách mệnh là tác phẩm tập hợp các bài giảng của Nguyễn Ái Quốc tại các lớp huấn luyện cán bộ của Hội Việt Nam Cách mạng Thanh niên, tổ chức tại Quảng Châu (Trung Quốc) trong những năm 1925-1927. Tác phẩm đóng vai trò quan trọng trong việc truyền bá chủ nghĩa Mác-Lênin vào Việt Nam, vạch ra con đường cách mạng đúng đắn cho dân tộc.",
    createdAt: new Date().toISOString()
  },
  {
    id: "sim-book-2",
    bookTitle: "Di chúc của Chủ tịch Hồ Chí Minh",
    author: "Hồ Chí Minh",
    summary: "Bản Di chúc lịch sử là tâm nguyện, tình cảm và ý chí của Người để lại cho toàn Đảng, toàn dân và toàn quân ta trước lúc đi xa. Văn kiện vô giá này tổng kết kinh nghiệm cách mạng và dặn dò những việc Chi bộ và nhân dân cần làm để xây dựng một nước Việt Nam hòa bình, thống nhất, độc lập, dân chủ và giàu mạnh.",
    createdAt: new Date().toISOString()
  },
  {
    id: "sim-book-3",
    bookTitle: "Sửa đổi lối làm việc",
    author: "Hồ Chí Minh",
    summary: "Tác phẩm được viết năm 1947, là cẩm nang giáo dục, rèn luyện tư cách đạo đức cách mạng của cán bộ, đảng viên. Người chỉ rõ: 'Đảng không phải là một tổ chức để làm quan phát tài. Nó phải làm tròn nhiệm vụ giải phóng dân tộc, làm cho Tổ quốc giàu mạnh, đồng bào sung sướng.'",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_CONTRIBUTIONS = [
  {
    id: "sim-contrib-1",
    title: "Học tập phong cách giản dị của Bác Hồ",
    authorName: "Đảng viên Nguyễn Văn An",
    content: "Là một cán bộ trẻ tại Chi bộ, tôi luôn tự răn dạy mình noi theo phong cách sống giản dị, tiết kiệm của Bác. Càng học Bác, tôi càng hiểu rằng sự gương mẫu trong lối sống đời thường chính là chìa khóa để giữ vững lòng tin của quần chúng nhân dân đối với Đảng.",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 ngày trước
  },
  {
    id: "sim-contrib-2",
    title: "Cảm nhận từ cuốn sách Đường Kách Mệnh",
    authorName: "Quần chúng ưu tú Lê Thị Mai",
    content: "Đọc Đường Kách Mệnh, tôi cảm nhận sâu sắc ý chí kiên cường và lòng yêu nước nồng nàn của Bác Hồ trong những năm bôn ba tìm đường cứu nước. Tác phẩm đã truyền cảm hứng mạnh mẽ để tôi nỗ lực rèn luyện, sớm đứng vào hàng ngũ của Chi bộ.",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 ngày trước
  },
  {
    id: "sim-contrib-3",
    title: "Hiến kế xây dựng Không gian Văn hóa số",
    authorName: "Trần Minh Hoàng",
    content: "Kính gửi Chi bộ, tôi đề xuất chúng ta nên số hóa thêm các tư liệu hình ảnh, thước phim tư liệu về Bác Hồ trên ứng dụng di động để các đoàn viên thanh niên dễ dàng tiếp cận và học tập mọi lúc mọi nơi.",
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_REFERENCES = [
  {
    id: "ref-doc-1",
    title: "Tư tưởng Hồ Chí Minh về xây dựng Chi bộ Đảng trong sạch, vững mạnh",
    author: "Ban Tuyên giáo Trung ương",
    summary: "Bài viết tổng hợp và phân tích sâu sắc các chỉ dẫn luận điểm của Chủ tịch Hồ Chí Minh về công tác xây dựng Đảng ở cấp cơ sở, nhấn mạnh vai trò tiên phong của chi bộ.",
    content: "Chi bộ là nền móng của Đảng, chi bộ tốt thì mọi việc đều tốt. Để xây dựng Chi bộ trong sạch vững mạnh, Chủ tịch Hồ Chí Minh yêu cầu mỗi cán bộ đảng viên phải tự phê bình và phê bình thường xuyên như rửa mặt hàng ngày. Công tác tư tưởng phải đi trước một bước, rèn luyện tư cách đạo đức cách mạng, quét sạch chủ nghĩa cá nhân. Bài viết này trình bày chi tiết 5 nguyên tắc tổ chức sinh hoạt chi bộ hiệu quả...",
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600",
    videoUrl: "https://www.youtube.com/embed/Pj1aK6nK478",
    createdAt: new Date().toISOString()
  },
  {
    id: "ref-doc-2",
    title: "Sổ tay sinh hoạt Chi bộ điện tử: Đổi mới và nâng cao chất lượng",
    author: "Tổ biên soạn Chi bộ",
    summary: "Hướng dẫn chi tiết về cách số hóa tài liệu sinh hoạt, ứng dụng công nghệ thông tin nâng cao hiệu quả tuyên truyền đạo đức Hồ Chí Minh tại Chi bộ.",
    content: "Đổi mới nội dung sinh hoạt chi bộ thông qua chuyển đổi số là nhiệm vụ trọng tâm hiện nay. Việc lưu trữ các tài liệu số hóa như tủ sách, hành trình di sản giúp các Đảng viên tiếp cận thông tin mọi lúc mọi nơi. Tài liệu này cung cấp bộ khung tổ chức sinh hoạt số hóa chuẩn gồm 3 giai đoạn: chuẩn bị nội dung điện tử, thảo luận trực tiếp và biểu quyết trực tuyến...",
    imageUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600",
    videoUrl: "",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Khởi tạo Simulated Database trong localStorage
function initSimulation() {
  if (!localStorage.getItem('hcm_books')) {
    localStorage.setItem('hcm_books', JSON.stringify(DEFAULT_BOOKS));
  }
  if (!localStorage.getItem('hcm_contributions')) {
    localStorage.setItem('hcm_contributions', JSON.stringify(DEFAULT_CONTRIBUTIONS));
  }
  if (!localStorage.getItem('hcm_references')) {
    localStorage.setItem('hcm_references', JSON.stringify(DEFAULT_REFERENCES));
  }
  if (!localStorage.getItem('hcm_admin_user')) {
    // Tài khoản Admin giả lập mặc định: admin@chibo.vn / chibo12345
    localStorage.setItem('hcm_admin_user', JSON.stringify({ email: "admin@chibo.vn", uid: "sim-admin-uid-123" }));
  }
}

// Thử kết nối Firebase thật nếu chế độ giả lập tắt
if (!isSimulationActive) {
  try {
    const { initializeApp: fbInitializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getAuth: fbGetAuth } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const { getFirestore: fbGetFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    // Kiểm tra xem cấu hình có phải mặc định không
    if (config.firebase.apiKey === "YOUR_FIREBASE_API_KEY") {
      console.warn("⚠️ Firebase configuration keys are placeholders. Falling back to Simulation Mode.");
      isSimulationActive = true;
      initSimulation();
    } else {
      app = fbInitializeApp(config.firebase);
      auth = fbGetAuth(app);
      db = fbGetFirestore(app);
      console.log("⚡ Firebase connected successfully!");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    console.warn("⚠️ Falling back to Simulation Mode (localStorage) due to network or config error.");
    isSimulationActive = true;
    initSimulation();
  }
} else {
  console.log("🛠️ App is running in Simulation Mode (localStorage database)");
  initSimulation();
}

// -------------------------------------------------------------
// DƯỚI ĐÂY LÀ CẦU NỐI API (BRIDGE FUNCTIONS) CHO CẢ HAI CHẾ ĐỘ
// -------------------------------------------------------------

// 1. Tủ sách điện tử (digital-books)
export async function getDigitalBooks() {
  if (isSimulationActive) {
    const books = JSON.parse(localStorage.getItem('hcm_books')) || [];
    // Sắp xếp mới nhất lên đầu
    return books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const { collection: fbCollection, getDocs: fbGetDocs, query: fbQuery, orderBy: fbOrderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const booksRef = fbCollection(db, "digital-books");
    const q = fbQuery(booksRef, fbOrderBy("createdAt", "desc"));
    const querySnapshot = await fbGetDocs(q);
    const books = [];
    querySnapshot.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() });
    });
    return books;
  }
}

export async function addDigitalBook(bookTitle, author, summary) {
  const newBook = {
    bookTitle,
    author,
    summary,
    createdAt: isSimulationActive ? new Date().toISOString() : new Date() // Firebase Timestamp
  };

  if (isSimulationActive) {
    const books = JSON.parse(localStorage.getItem('hcm_books')) || [];
    newBook.id = "book-" + Math.random().toString(36).substr(2, 9);
    books.push(newBook);
    localStorage.setItem('hcm_books', JSON.stringify(books));
    return newBook;
  } else {
    const { collection: fbCollection, addDoc: fbAddDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = await fbAddDoc(fbCollection(db, "digital-books"), newBook);
    return { id: docRef.id, ...newBook };
  }
}

export async function updateDigitalBook(id, bookTitle, author, summary) {
  if (isSimulationActive) {
    const books = JSON.parse(localStorage.getItem('hcm_books')) || [];
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index].bookTitle = bookTitle;
      books[index].author = author;
      books[index].summary = summary;
      localStorage.setItem('hcm_books', JSON.stringify(books));
      return true;
    }
    return false;
  } else {
    const { doc: fbDoc, updateDoc: fbUpdateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "digital-books", id);
    await fbUpdateDoc(docRef, { bookTitle, author, summary });
    return true;
  }
}

export async function deleteDigitalBook(id) {
  if (isSimulationActive) {
    const books = JSON.parse(localStorage.getItem('hcm_books')) || [];
    const filtered = books.filter(b => b.id !== id);
    localStorage.setItem('hcm_books', JSON.stringify(filtered));
    return true;
  } else {
    const { doc: fbDoc, deleteDoc: fbDeleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "digital-books", id);
    await fbDeleteDoc(docRef);
    return true;
  }
}

// 2. Bài viết đóng góp (contributions)
export async function getApprovedContributions() {
  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    return contribs
      .filter(c => c.status === 'approved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const { collection: fbCollection, getDocs: fbGetDocs, query: fbQuery, where: fbWhere, orderBy: fbOrderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const contribRef = fbCollection(db, "contributions");
    const q = fbQuery(contribRef, fbWhere("status", "==", "approved"), fbOrderBy("createdAt", "desc"));
    const querySnapshot = await fbGetDocs(q);
    const contribs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Chuyển đổi timestamp của Firebase thành ISO hoặc giữ nguyên
      contribs.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });
    return contribs;
  }
}

export async function getPendingContributions() {
  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    return contribs
      .filter(c => c.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const { collection: fbCollection, getDocs: fbGetDocs, query: fbQuery, where: fbWhere, orderBy: fbOrderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const contribRef = fbCollection(db, "contributions");
    const q = fbQuery(contribRef, fbWhere("status", "==", "pending"), fbOrderBy("createdAt", "desc"));
    const querySnapshot = await fbGetDocs(q);
    const contribs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      contribs.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });
    return contribs;
  }
}

export async function addContribution(title, authorName, content) {
  const newContrib = {
    title,
    authorName: authorName.trim() === "" ? "Ẩn danh" : authorName,
    content,
    status: "pending",
    createdAt: isSimulationActive ? new Date().toISOString() : new Date()
  };

  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    newContrib.id = "contrib-" + Math.random().toString(36).substr(2, 9);
    contribs.push(newContrib);
    localStorage.setItem('hcm_contributions', JSON.stringify(contribs));
    return newContrib;
  } else {
    const { collection: fbCollection, addDoc: fbAddDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = await fbAddDoc(fbCollection(db, "contributions"), newContrib);
    return { id: docRef.id, ...newContrib };
  }
}

export async function updateContribution(id, status, content = null) {
  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    const index = contribs.findIndex(c => c.id === id);
    if (index !== -1) {
      contribs[index].status = status;
      if (content !== null) {
        contribs[index].content = content;
      }
      localStorage.setItem('hcm_contributions', JSON.stringify(contribs));
      return true;
    }
    return false;
  } else {
    const { doc: fbDoc, updateDoc: fbUpdateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "contributions", id);
    const updateData = { status: status };
    if (content !== null) {
      updateData.content = content;
    }
    await fbUpdateDoc(docRef, updateData);
    return true;
  }
}

export async function updateContributionFull(id, title, authorName, content, status) {
  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    const index = contribs.findIndex(c => c.id === id);
    if (index !== -1) {
      contribs[index].title = title;
      contribs[index].authorName = authorName.trim() === "" ? "Ẩn danh" : authorName;
      contribs[index].content = content;
      contribs[index].status = status;
      localStorage.setItem('hcm_contributions', JSON.stringify(contribs));
      return true;
    }
    return false;
  } else {
    const { doc: fbDoc, updateDoc: fbUpdateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "contributions", id);
    await fbUpdateDoc(docRef, { 
      title, 
      authorName: authorName.trim() === "" ? "Ẩn danh" : authorName, 
      content, 
      status 
    });
    return true;
  }
}

export async function deleteContribution(id) {
  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    const filtered = contribs.filter(c => c.id !== id);
    localStorage.setItem('hcm_contributions', JSON.stringify(filtered));
    return true;
  } else {
    const { doc: fbDoc, deleteDoc: fbDeleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "contributions", id);
    await fbDeleteDoc(docRef);
    return true;
  }
}

export async function getArchivedContributions() {
  if (isSimulationActive) {
    const contribs = JSON.parse(localStorage.getItem('hcm_contributions')) || [];
    return contribs
      .filter(c => c.status === 'approved' || c.status === 'rejected')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const { collection: fbCollection, getDocs: fbGetDocs, query: fbQuery, where: fbWhere, orderBy: fbOrderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const contribRef = fbCollection(db, "contributions");
    const q = fbQuery(contribRef, fbWhere("status", "in", ["approved", "rejected"]), fbOrderBy("createdAt", "desc"));
    const querySnapshot = await fbGetDocs(q);
    const contribs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      contribs.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });
    return contribs;
  }
}

// 3. Quản trị viên Authentication
export async function login(email, password) {
  if (isSimulationActive) {
    // Tài khoản mặc định cho giả lập
    if (email === "admin@chibo.vn" && password === "chibo12345") {
      const user = { email: "admin@chibo.vn", uid: "sim-admin-uid-123" };
      sessionStorage.setItem('hcm_logged_in_user', JSON.stringify(user));
      return user;
    } else {
      throw new Error("Thông tin đăng nhập giả lập không đúng (Sử dụng: admin@chibo.vn / chibo12345)");
    }
  } else {
    const { signInWithEmailAndPassword: fbSignInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const userCredential = await fbSignInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }
}

export async function logout() {
  if (isSimulationActive) {
    sessionStorage.removeItem('hcm_logged_in_user');
    return true;
  } else {
    const { signOut: fbSignOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    await fbSignOut(auth);
    return true;
  }
}

export async function onAuthStateChange(callback) {
  if (isSimulationActive) {
    // Trả về trạng thái hiện tại ngay lập tức cho giả lập
    const user = JSON.parse(sessionStorage.getItem('hcm_logged_in_user'));
    callback(user);
    // Trả về một hàm unsubscribe giả lập
    return () => {};
  } else {
    const { onAuthStateChanged: fbOnAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    return fbOnAuthStateChanged(auth, callback);
  }
}

export function isSimulation() {
  return isSimulationActive;
}

// 4. Tài liệu tham khảo (reference_documents)
export async function getReferenceDocuments() {
  if (isSimulationActive) {
    const refs = JSON.parse(localStorage.getItem('hcm_references')) || [];
    return refs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const { collection: fbCollection, getDocs: fbGetDocs, query: fbQuery, orderBy: fbOrderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const refCol = fbCollection(db, "reference_documents");
    const q = fbQuery(refCol, fbOrderBy("createdAt", "desc"));
    const querySnapshot = await fbGetDocs(q);
    const refs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      refs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });
    return refs;
  }
}

export async function addReferenceDocument(title, author, summary, content, imageUrl, videoUrl) {
  const newRef = {
    title,
    author: author.trim() === "" ? "Ban biên tập" : author,
    summary,
    content,
    imageUrl: imageUrl.trim(),
    videoUrl: videoUrl.trim(),
    createdAt: isSimulationActive ? new Date().toISOString() : new Date()
  };

  if (isSimulationActive) {
    const refs = JSON.parse(localStorage.getItem('hcm_references')) || [];
    newRef.id = "ref-" + Math.random().toString(36).substr(2, 9);
    refs.push(newRef);
    localStorage.setItem('hcm_references', JSON.stringify(refs));
    return newRef;
  } else {
    const { collection: fbCollection, addDoc: fbAddDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = await fbAddDoc(fbCollection(db, "reference_documents"), newRef);
    return { id: docRef.id, ...newRef };
  }
}

export async function updateReferenceDocument(id, title, author, summary, content, imageUrl, videoUrl) {
  if (isSimulationActive) {
    const refs = JSON.parse(localStorage.getItem('hcm_references')) || [];
    const index = refs.findIndex(r => r.id === id);
    if (index !== -1) {
      refs[index].title = title;
      refs[index].author = author.trim() === "" ? "Ban biên tập" : author;
      refs[index].summary = summary;
      refs[index].content = content;
      refs[index].imageUrl = imageUrl.trim();
      refs[index].videoUrl = videoUrl.trim();
      localStorage.setItem('hcm_references', JSON.stringify(refs));
      return true;
    }
    return false;
  } else {
    const { doc: fbDoc, updateDoc: fbUpdateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "reference_documents", id);
    await fbUpdateDoc(docRef, {
      title,
      author: author.trim() === "" ? "Ban biên tập" : author,
      summary,
      content,
      imageUrl: imageUrl.trim(),
      videoUrl: videoUrl.trim()
    });
    return true;
  }
}

export async function deleteReferenceDocument(id) {
  if (isSimulationActive) {
    const refs = JSON.parse(localStorage.getItem('hcm_references')) || [];
    const filtered = refs.filter(r => r.id !== id);
    localStorage.setItem('hcm_references', JSON.stringify(filtered));
    return true;
  } else {
    const { doc: fbDoc, deleteDoc: fbDeleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = fbDoc(db, "reference_documents", id);
    await fbDeleteDoc(docRef);
    return true;
  }
}
