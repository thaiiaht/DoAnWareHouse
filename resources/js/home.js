// home.js
document.addEventListener('DOMContentLoaded', () => {
  // --------------------------
  // Sidebar toggle
  // --------------------------
  const sidebar = document.getElementById("side-bar")
  const menuBtn = document.getElementById("menu-btn")

  if (sidebar && menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      sidebar.classList.toggle("active")
    })

    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("active") &&
          !sidebar.contains(e.target) &&
          !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active")
      }
    })
  }

  // --------------------------
  // Modal open/close functions
  // --------------------------
  window.openLogin = () => {
    const modal = document.getElementById('loginModal')
    if (modal) modal.style.display = 'block'
  }

  window.closeLogin = () => {
    const modal = document.getElementById('loginModal')
    if (modal) modal.style.display = 'none'
  }

  window.openRegister = () => {
    const modal = document.getElementById('registerModal')
    if (modal) modal.style.display = 'block'
  }

  window.closeRegister = () => {
    const modal = document.getElementById('registerModal')
    if (modal) modal.style.display = 'none'
  }

  // --------------------------
  // LOGIN
  // --------------------------
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const email = document.getElementById('email')?.value?.trim() || ''
      const password = document.getElementById('password')?.value?.trim() || ''

      if (!email || !password) {
        alert('Vui lòng nhập đầy đủ thông tin!')
        return
      }

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        })

        if (!res.ok) {
          alert('Email hoặc mật khẩu không đúng!')
          return
        }

        alert('Đăng nhập thành công!')
        const modal = document.getElementById('loginModal')
        if (modal) modal.style.display = 'none'
        window.location.reload()
      } catch (err) {
        console.error('Login error:', err)
        alert('Đã có lỗi xảy ra, hãy thử lại!')
      }
    })
  }

  // --------------------------
  // REGISTER
  // --------------------------
  const registerForm = document.getElementById('registerForm')
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const fullName = document.getElementById('fullName')?.value?.trim() || ''
      const email = document.getElementById('emailR')?.value?.trim() || ''
      const password = document.getElementById('passwordR')?.value?.trim() || ''

      if (!fullName || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!')
        return
      }

      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password }),
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          alert(data.messages || 'Đăng ký thất bại, hãy thử lại!')
          return
        }

        alert('Đăng ký thành công!')
        const modal = document.getElementById('registerModal')
        if (modal) modal.style.display = 'none'
        window.location.reload()
      } catch (err) {
        console.error('Register error:', err)
        alert('Đã có lỗi xảy ra, hãy thử lại!')
      }
    })
  }

  // --------------------------
  // LOGOUT
  // --------------------------
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.closest('#logoutBtn')) {
      e.preventDefault()
      try {
        const res = await fetch('/logout', {
          method: 'POST',
          credentials: 'include'
        })
        if (res.ok) {
          alert('Logout thành công!')
          window.location.reload()
        } else {
          console.error('Logout failed', res.status)
        }
      } catch (err) {
        console.error('Logout error:', err)
      }
    }
  })

  // --------------------------
  // Show login/register divs if exist
  // --------------------------
  const loginDiv = document.getElementById('loginDiv')
  if (loginDiv) loginDiv.style.display = 'block'

  const registerDiv = document.getElementById('registerDiv')
  if (registerDiv) registerDiv.style.display = 'block'
})
