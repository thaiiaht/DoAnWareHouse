import { Transmit } from '@adonisjs/transmit-client'
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const currentRole = window.UserRole

const transmit = new Transmit({
  baseUrl: window.location.origin})

document.addEventListener("DOMContentLoaded", () => {
    initRealtime()
})

async function initRealtime() {
    // thông báo khi sắp tới kiot nào
    const isub = transmit.subscription('/notification/incoming')
    isub.onMessage((payload) => {
        if (payload.kioskName === currentRole) {
            toastr.success(payload.message, payload.title);
        }
    })
    await isub.create()

    // thông báo khi đã có hàng đến kiot
    const sub = transmit.subscription('/notification/arrived')
    sub.onMessage((payload) => {
        // toastr.success(payload.message, payload.title);
        if (payload.kioskName === currentRole) {
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
    //   try {
    //     const response = await fetch('/api/kiot/reset', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         // Nhớ thêm CSRF Token nếu project có bật
    //       },
    //       body: JSON.stringify({ kiot: kiotId })
    //     })

    //     if (response.ok) {
    //       Swal.fire('Thành công!', 'Đã gửi lệnh reset xuống ESP.', 'success')
    //     } else {
    //       Swal.fire('Lỗi!', 'Không gửi được lệnh.', 'error')
    //     }
    //   } catch (error) {
    //     console.error(error)
    //   }
    window.location.reload()
    }
