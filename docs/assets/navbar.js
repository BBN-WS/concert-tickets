import { supabase, getProfile } from "./supabase.js";

export async function renderNavbar() {
  const root = document.getElementById("nav-root");
  if (!root) return;

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile(user.id) : null;

  root.innerHTML = `
    <header class="nav">
      <div class="nav-inner">
        <a href="index.html" class="brand"><span class="accent">Ticket</span>Box</a>
        <div class="nav-links">
          <a href="index.html">คอนเสิร์ต</a>
          ${user ? `
            <a href="tickets.html">บัตรของฉัน</a>
            ${profile?.is_admin ? '<a href="admin.html" style="color:#e879f9">Admin</a>' : ""}
            <span style="color:#a3a3a3" class="hide-sm">สวัสดี, ${escapeHtml(profile?.name ?? user.email)}</span>
            <button class="btn btn-sm" id="logout-btn">ออกจากระบบ</button>
          ` : `
            <a href="login.html">เข้าสู่ระบบ</a>
            <a href="register.html" class="btn btn-primary btn-sm">สมัครสมาชิก</a>
          `}
        </div>
      </div>
    </header>
  `;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      location.href = "index.html";
    });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}
