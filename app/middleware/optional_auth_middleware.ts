import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class OptionalAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Không redirect, chỉ check
    try {
      await ctx.auth.use('web').check()
    } catch {
      // Nếu check lỗi (chưa đăng nhập) thì kệ, không làm gì
    }

    // Chia sẻ biến user cho view (nếu có)
    ctx.view.share({ user: ctx.auth.use('web').user })

    await next()
  }
}