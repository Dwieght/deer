import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#EE4D2D]">Account Page</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Customer sign up placeholder</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          The storefront navbar now includes separate login and sign-up entry points. If you want,
          I can wire this page next to a real customer authentication flow.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#EE4D2D] px-5 py-3 text-sm font-bold text-white"
          >
            Back to Store
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
