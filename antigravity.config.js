// Cấu hình hệ thống "Không Gian Văn Hóa Hồ Chí Minh"
const config = {
  // Chế độ giả lập (Simulation Mode): 
  // - true: Sử dụng localStorage làm cơ sở dữ liệu tạm thời (thuận tiện chạy thử nghiệm ngay lập tức)
  // - false: Sử dụng cơ sở dữ liệu thật kết nối với Firebase Firestore & Auth
  useSimulation: false,

  // Thông số cấu hình Firebase (Thay thế bằng thông tin dự án của bạn khi useSimulation = false)
  firebase: {
    apiKey: "AIzaSyDx6ScIXKHjIrzBtgXPCIGQ-Y4cksYgyVM",
    authDomain: "khong-gian-van-hoa-beb48.firebaseapp.com",
    projectId: "khong-gian-van-hoa-beb48",
    storageBucket: "khong-gian-van-hoa-beb48.firebasestorage.app",
    messagingSenderId: "551053800927",
    appId: "1:551053800927:web:dd0b2d9fb99e94054e006a"
  }
};

export default config;
