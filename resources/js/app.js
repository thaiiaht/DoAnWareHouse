import { Transmit } from '@adonisjs/transmit-client';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import Swal from 'sweetalert2';
import { Html5Qrcode } from 'html5-qrcode';

const currentRole = window.UserRole;
let html5QrCode = null;
let currentScannedData = null;

const transmit = new Transmit({ baseUrl: window.location.origin });

document.addEventListener("DOMContentLoaded", () => {
    initRealtime();
    initGatekeeper();
});

async function initRealtime() {
    // thông báo khi sắp tới kiot nào
    const isub = transmit.subscription('/notification/incoming')
    isub.onMessage((payload) => {
        if (payload.kioskName === currentRole || currentRole === "admin") {
            toastr.success(payload.message, payload.title);
        }
    })
    await isub.create()

    // thông báo khi đã có hàng đến kiot
    const sub = transmit.subscription('/notification/arrived')
    sub.onMessage((payload) => {
        // toastr.success(payload.message, payload.title);
        if (payload.kioskName === currentRole || currentRole === "admin") {
            showPopup(payload)
        }
    })
    await sub.create()

    // thông báo và update thông tin khi hàng ra vào kiot
    const kiotSub = transmit.subscription('/kiot/updates')
    await kiotSub.create()
    // 2. Lắng nghe sự kiện
    kiotSub.onMessage((data) => {
        // --- TRƯỜNG HỢP 1: CÓ LỖI (VÍ DỤ: KHO ĐẦY) ---
        if (data.status === 'error') {
            // Hiện thông báo màu đỏ (Error)
            toastr.error(data.message, "Cảnh báo!")
            return; // Dừng lại, không làm gì thêm
        }

        // --- TRƯỜNG HỢP 2: THÀNH CÔNG (CẬP NHẬT SỐ) ---
        if (data.status === 'success') {
            // A. Hiện thông báo màu xanh
            toastr.success(data.message, "Thành công")

            // B. Tìm đúng các thẻ HTML của Kiot đó để sửa số
            // Giả sử kiotName gửi về là 'kho-a'
            const currentId = `${data.kiotName}-current`   // ID: kho-a-current
            const remainId  = `${data.kiotName}-remain`    // ID: kho-a-remain
            
            const currentEl = document.getElementById(currentId)
            const remainEl  = document.getElementById(remainId)

            // C. Cập nhật text
            if (currentEl) currentEl.innerText = `${data.newTotal} items`
            if (remainEl)  remainEl.innerText  = `${data.newRemaining} items`

            // D. (Option) Hiệu ứng nháy sáng để admin chú ý
            const cardId = `${data.kiotName}-card`
            const card = document.getElementById(cardId)
            if (card) {
                card.style.transition = "background-color 0.5s"
                card.style.backgroundColor = "#d4edda" // Màu xanh nhạt
                setTimeout(() => {
                    card.style.backgroundColor = "" // Trả về màu cũ
                }, 1000)
            }
        }
    })
}

// 3. Hàm hiện Popup SweetAlert2
function showPopup(data) {
    Swal.fire({
    title: '🚚 ' + data.title,
    text: data.message,
    icon: 'info',
    showCancelButton: false,
    confirmButtonColor: '#3085d6',
    confirmButtonText: '✅ Đã xong (Về vị trí cũ)',
    allowOutsideClick: false // Bắt buộc phải bấm nút
    }).then((result) => {
    
    // 4. Khi người dùng bấm nút "Đã xong"
    if (result.isConfirmed) {
        sendResetCommand(data.kiotId)
    }
  })
}

async function sendResetCommand(kiotId) {
      try {
        const response = await fetch('/api/kiot/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Nhớ thêm CSRF Token nếu project có bật
          },
          body: JSON.stringify({ kiot: kiotId })
        })

        if (response.ok) {
          Swal.fire('Thành công!', 'Đã gửi lệnh reset xuống ESP.', 'success')
        } else {
          Swal.fire('Lỗi!', 'Không gửi được lệnh.', 'error')
        }
      } catch (error) {
        console.error(error)
      }
    }

// --- GATEKEEPER LOGIC ---
function initGatekeeper() {
    const btnGateAction = document.getElementById('btnGateAction');
    if (!btnGateAction) return;

    btnGateAction.addEventListener('click', function(e) {
        e.preventDefault();

        Swal.fire({
            title: '<span style="color: #2f3542; font-weight:700; font-size: 24px;">Hệ thống đang chạy</span>',
            width: '650px', // ĐỘ RỘNG POPUP
            customClass: {
                popup: 'swal-wide-popup'
            },
            html: `
                <div class="swal-iot-container" style="padding: 10px ;">
                    <div id="qr-reader-inline"></div>
                    
                    <div id="qr-result-container" style="display: none; margin-top: 20px; padding: 15px; background: #f1f9f4; border: 2px solid #2ed573; border-radius: 12px;">
                        <div id="qr-data-content"></div>
                        <button id="btn-confirm-qr" type="button" style="background: #2ed573; color: white; border: none; width: 100%; padding: 15px; border-radius: 10px; margin-top: 15px; cursor: pointer; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(46, 213, 115, 0.2);">
                            XÁC NHẬN NHẬP HÀNG (OK)
                        </button>
                    </div>

                    <div id="scan-status" style="margin-top: 20px; font-size: 16px; color: #57606f;">
                        <i class="fa-solid fa-qrcode fa-beat-fade"></i> Vui lòng đưa mã QR vào khung quét...
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-stop"></i> Đã nhập hàng xong',
            confirmButtonColor: '#ff4757',
            allowOutsideClick: false,
            didOpen: async () => {
                html5QrCode = new Html5Qrcode("qr-reader-inline");
                fetch('/api/iot/start', { method: 'POST' });

                try {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { 
                            fps: 20, 
                            qrbox: (w, h) => ({ width: h * 0.7, height: h * 0.7 }) 
                        },
                        (text) => { handleQrDetected(text); }
                    );
                } catch (err) { toastr.error("Lỗi khởi động camera!"); }

                document.addEventListener('click', handleInternalOk);
            },
            preConfirm: async () => {
                document.removeEventListener('click', handleInternalOk);
                if (html5QrCode) await html5QrCode.stop().catch(() => {});
                await fetch('/api/iot/end', { method: 'POST' }).catch(() => {});
                return true;
            }
        });
    });
}

function handleQrDetected(qrData) {
    html5QrCode.pause(true); 
    currentScannedData = qrData;

    let tableContent = '';
    try {
        const data = JSON.parse(qrData);
        tableContent = `
            <table class="qr-data-table">
                <tr><td class="qr-label">Sản phẩm:</td><td class="qr-value" style="font-size: 18px; color: #1e3799;">${data.product_name || 'N/A'}</td></tr>
                <tr><td class="qr-label">Số lượng:</td><td class="qr-value">${data.quantity || 1}</td></tr>
                <tr><td class="qr-label">ID Kiện:</td><td class="qr-value" style="font-size:11px">${data.unique_id || 'N/A'}</td></tr>
            </table>
        `;
    } catch (e) {
        tableContent = `<div style="padding:15px; word-break:break-all; font-family: monospace;">${qrData}</div>`;
    }

    document.getElementById('qr-data-content').innerHTML = tableContent;
    document.getElementById('qr-result-container').style.display = 'block';
    document.getElementById('scan-status').style.display = 'none';
}

async function handleInternalOk(e) {
    if (e.target && e.target.id === 'btn-confirm-qr') {
        // 1. Gửi API chạy ngầm (không dùng await ở đây để không phải chờ)
        fetch('/api/warehouse/receive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qr_data: currentScannedData })
        })
        // 3. Reset giao diện và QUÉT TIẾP NGAY LẬP TỨC
        const resultContainer = document.getElementById('qr-result-container');
        const scanStatus = document.getElementById('scan-status');

        if (resultContainer) resultContainer.style.display = 'none';
        if (scanStatus) scanStatus.style.display = 'block';

        currentScannedData = null;

        // Kích hoạt lại camera
        if (html5QrCode) {
            html5QrCode.resume();
        }
    }
}