import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser, isAuthDisabled } from "@/lib/auth/session";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="rounded-lg bg-white/5 px-3 py-3">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-white/60 truncate">{user.email}</p>
        <p className="mt-1 text-xs text-white/40 uppercase tracking-wide">
          {user.role}
        </p>
      </div>

      {!isAuthDisabled() && (
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      )}

      {isAuthDisabled() && (
        <p className="mt-3 text-xs text-amber-300/80">
          Auth disabled (dev mode)
        </p>
      )}
    </div>
  );
}
