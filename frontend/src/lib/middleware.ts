import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/' // Whitelist the homepage
  ) {
    // no user, redirect to login page with the original URL as a query parameter
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Store the original URL as a redirect_to parameter
    url.searchParams.set('redirect_to', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and there's a redirect_to parameter in the URL
  // redirect them to their original destination
  if (user && request.nextUrl.pathname.startsWith('/auth/login') && request.nextUrl.searchParams.has('redirect_to')) {
    const redirectTo = request.nextUrl.searchParams.get('redirect_to') || '/'
    const url = request.nextUrl.clone()
    url.pathname = redirectTo.split('?')[0]
    // Preserve any query parameters from the original URL
    if (redirectTo.includes('?')) {
      const originalParams = new URLSearchParams(redirectTo.split('?')[1])
      originalParams.forEach((value, key) => {
        url.searchParams.set(key, value)
      })
    }
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
