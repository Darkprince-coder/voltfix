# ⚡ VoltFix — Repair Shop Manager

A professional inventory and repair management web app built for small electrical repair shops in Kenya.

---

## 📦 Tech Stack

| Layer        | Technology                              |
|------------- |-----------------------------------------|
| Frontend     | React 18 + Vite                         |
| Styling      | Tailwind CSS v3.4                       |
| Routing      | React Router v6                         |
| Backend/Auth | Supabase (PostgreSQL + Auth)            |
| Charts       | Recharts                                |
| Icons        | Lucide React                            |
| Toasts       | React Hot Toast                         |
| Dates        | date-fns                                |

---

## 🗂️ Project Structure

```
voltfix/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   └── Topbar.jsx        # Top header bar
│   │   └── ui/
│   │       ├── Modal.jsx         # Reusable modal dialog
│   │       ├── StatCard.jsx      # Dashboard metric cards
│   │       └── index.jsx         # Badge, Spinner, EmptyState, ConfirmDialog
│   ├── context/
│   │   └── AuthContext.jsx       # Supabase auth state + provider
│   ├── hooks/
│   │   ├── useInventory.js       # Inventory CRUD
│   │   ├── useJobs.js            # Repair jobs CRUD
│   │   └── usePayments.js        # Payments CRUD
│   ├── lib/
│   │   └── supabase.js           # Supabase client
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── JobsPage.jsx
│   │   ├── PaymentsPage.jsx
│   │   └── ReportsPage.jsx
│   ├── utils/
│   │   └── helpers.js            # formatKsh, formatDate, statusBadge, etc.
│   ├── App.jsx                   # Root component + routing
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind + design tokens
├── supabase_schema.sql           # Copy-paste into Supabase SQL Editor
├── .env.example                  # Environment variable template
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚀 Setup Instructions

### Step 1 — Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**, give it a name e.g. `voltfix`, choose a strong password
3. Wait for the project to be ready (~1 minute)

### Step 2 — Run the database schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase_schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **Run** (▶)
6. You should see "Success. No rows returned"

### Step 3 — Create your login account

1. In Supabase dashboard → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter your email and a password
4. This is the account you'll use to log into VoltFix

### Step 4 — Get your API keys

1. In Supabase dashboard → **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 5 — Set up environment variables

```bash
# In the project root folder:
cp .env.example .env
```

Open `.env` and fill in your values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 6 — Install dependencies and run

```bash
# Install packages
npm install

# Start development server
npm run dev
```

Open your browser at **http://localhost:5173**

---

## 🏗️ Build for Production

```bash
npm run build
```

The `dist/` folder contains the static files ready to deploy anywhere:
- [Vercel](https://vercel.com) (recommended — free, fast)
- [Netlify](https://netlify.com)
- Any static hosting

### Deploy to Vercel (easiest)

```bash
npm install -g vercel
vercel
```

Set the environment variables in Vercel dashboard → Project → Settings → Environment Variables.

---

## ✨ Features

| Feature                | Description                                               |
|------------------------|-----------------------------------------------------------|
| **Dashboard**          | Today's revenue, job count, pending jobs, low stock alerts |
| **Inventory**          | Add/edit/delete spare parts, stock tracking, low stock alerts |
| **Repair Jobs**        | Full job lifecycle — create, update status, add parts used |
| **Auto Stock Reduce**  | Stock automatically reduces when a job is marked complete |
| **Payments**           | Record Cash or M-Pesa payments per job, track balances    |
| **Reports**            | Revenue/job charts (7-day), device type distribution, payment split |
| **Authentication**     | Supabase email/password login                             |
| **Responsive UI**      | Works on phone, tablet, desktop                           |
| **KSh Currency**       | All amounts displayed in Kenyan Shillings                 |

---

## 🔑 Environment Variables

| Variable                  | Description                         |
|---------------------------|-------------------------------------|
| `VITE_SUPABASE_URL`       | Your Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`  | Your Supabase anon/public API key   |

---

## 🛠️ Customisation Tips

- **Add more device types**: Edit the `DEVICE_TYPES` array in `src/pages/JobsPage.jsx`
- **Change low stock threshold**: Edit the default per-item or change the global default in `useInventory.js`
- **Add more users**: Go to Supabase → Authentication → Users → Add User
- **Change the shop name**: Search for "VoltFix" across the codebase and replace
- **Print receipt**: Add `window.print()` on a job detail view

---

## 📞 Support

Built for Kenyan repair shops. For issues, check that:
1. Your `.env` values are correct (no extra spaces)
2. The SQL schema ran without errors
3. RLS policies are enabled in Supabase

---

*VoltFix · Made with ⚡ for small business owners*
