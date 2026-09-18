# Audience Q&A — VNGGames ON 07/10/2026

A web app that lets employees ask questions anonymously at the VNGGames ON event and vote on questions they like. Event organizers (admin) approve questions before they appear on the display screen for everyone to see.

## What This App Does

The app has **three separate screens**, each for a different purpose:

| Screen | Who Uses It | Device | How to Access |
|--------|-----------|--------|---------------|
| **Display** | Shown on stage / projector | PC or TV only | Visit the URL directly on the projector computer |
| **Employee** | Employees at the event | Mobile phones only | Scan the QR code shown on the Display screen |
| **Admin** | Event organizers | Mobile phone | Secret link (no password needed) |

### The Three URLs

Once the app is live, you'll have:
- **Display screen:** `https://yourdomain.vercel.app/display`
- **Employee screen:** `https://yourdomain.vercel.app/employee`
- **Admin screen:** `https://yourdomain.vercel.app/admin/YOUR_SECRET_TOKEN`

## What You Need Before Deploying

To get this app running, you need two pieces of secret information stored in the app's "settings":

1. **DATABASE_URL** — the connection string to your database (explains how the app connects to the database)
2. **ADMIN_SECRET_TOKEN** — a long random password that protects the admin screen (only people with this secret link can approve questions)

These are called **environment variables**. You'll set them in two places:
- In a local `.env` file (for testing on your own computer)
- In Vercel's project settings (for the live website)

---

## Step 1: Create a Free Postgres Database

The app stores questions, likes, and voting data in a **Postgres database** — a safe place to keep information online.

You have two free options. Pick one:

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and sign up with your email or GitHub account.
2. Create a new project.
3. Neon will show you a connection string. It looks like:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
4. **Copy this entire string** — you'll need it later. Keep it secret.

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and sign up with your email or GitHub account.
2. Create a new project.
3. In the left sidebar, click **Settings** → **Database**.
4. Under "Connection String", select **URI** (not Connection Pooler).
5. **Copy the entire connection string** — you'll need it later. Keep it secret.

---

## Step 2: Generate the Admin Secret Token

This is a long random password that protects the admin screen. Anyone with the admin URL can access it, so the token must be very hard to guess.

On your computer (Mac, Linux, or Windows with Git Bash / PowerShell):

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

This will print a line like: `a7f3b2c8e1d9f4g6h2i5j8k1l4m9n3o6p7q2r5s`

**Copy this entire random string.** You'll need it in the next steps.

---

## Step 3: Set Up the Database Tables

The database needs to be told what kind of information it will store. This is done by running a **schema** — a set of instructions that creates the tables.

### For Neon:

1. Log in to [neon.tech](https://neon.tech).
2. Open your project.
3. Click **SQL Editor** in the left sidebar.
4. Click **New Query**.
5. Open the file `schema.sql` from the project folder (ask your developer for it, or find it at the root of the GitHub repo).
6. Copy **all the contents** of that file.
7. Paste it into the SQL Editor window in Neon.
8. Click **Execute** (or press Ctrl+Enter).
9. You should see a message like "Success" — the tables are now created.

### For Supabase:

1. Log in to [supabase.com](https://supabase.com).
2. Open your project.
3. In the left sidebar, click **SQL Editor**.
4. Click **New query**.
5. Copy **all the contents** of the `schema.sql` file from the project folder.
6. Paste it into the query editor.
7. Click **Run** (or press Ctrl+Enter).
8. You should see a message confirming success.

---

## Step 4: Deploy to Vercel

Vercel is a free hosting service made by the creators of Next.js (the technology this app is built with). It automatically updates whenever you push code changes.

### 4.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up. The easiest way is to sign in with your GitHub account.
2. Once logged in, click **Add New...** → **Project**.
3. Click **Import Git Repository**.
4. Copy and paste this GitHub URL: `https://github.com/dattran1551/Voting-poll-app`
5. Click **Import** (Vercel may ask for your GitHub permission — allow it).

### 4.2 Set Environment Variables in Vercel

After clicking Import, Vercel shows you a settings page before deploying.

1. Scroll down to **Environment Variables**.
2. Add two variables:
   - **Key:** `DATABASE_URL` → **Value:** Paste the database connection string you copied in Step 1
   - **Key:** `ADMIN_SECRET_TOKEN` → **Value:** Paste the random token you generated in Step 2

3. Click **Deploy** (or **Create** if you see that button instead).
4. Vercel starts building and deploying. Wait 2–5 minutes.
5. You'll see a green checkmark and a link like: `https://voting-poll-app-xyz.vercel.app`

**Save this link.** This is your live domain.

### 4.3 Push Code Updates (Important)

The code for this app is stored on GitHub. To make changes or keep the app updated, you need to **push** code from your local computer to GitHub. This is a one-time setup:

1. On your local computer, open **PowerShell** (Windows) or **Terminal** (Mac/Linux).
2. Go to the project folder:
   ```bash
   cd C:\Users\VNG\Voting-poll-app
   ```
   (on Mac, the path will be different — ask your developer)

3. If you don't have GitHub set up yet on this computer, run:
   ```bash
   git config --global user.email "your-email@example.com"
   git config --global user.name "Your Name"
   ```

4. To push code to GitHub the first time, run:
   ```bash
   git push -u origin docs/spec-audience-qa
   ```
   This will ask for your GitHub username and password (or a personal access token). Enter them.

5. After that, you can make a **pull request** on GitHub to merge your branch into `main`, which triggers a new deployment.

**Note:** Pushing code requires your own GitHub login. We cannot push without it.

---

## Step 5: Test the Live App

Before the event, test everything to make sure it works:

### The Full Smoke Test

1. **Open the Display screen**
   - Visit: `https://yourdomain.vercel.app/display` (replace `yourdomain` with your actual domain from Vercel)
   - You should see the VNGGames ON logo, a QR code, and a message "No questions yet / Chưa có câu hỏi nào"

2. **Open the Employee screen on your phone**
   - Scan the QR code shown on the Display with your phone
   - Or manually visit: `https://yourdomain.vercel.app/employee`
   - You should see a box to type a question and a button "Submit / Gửi câu hỏi"

3. **Submit a test question**
   - Type: "Is this question visible? / Câu hỏi này có nhìn thấy không?"
   - Click **Submit**
   - You should see a success message: "Sent successfully! / Đã gửi thành công!"

4. **Open the Admin screen**
   - Visit: `https://yourdomain.vercel.app/admin/YOUR_SECRET_TOKEN` (use the token you generated)
   - You should see a tab called "Pending Questions" with your test question in the list

5. **Approve the question**
   - On the Admin screen, click the **Approve** button next to your test question
   - The question should disappear from the "Pending Questions" tab

6. **See it on Display**
   - Go back to the Display screen (refresh if needed)
   - Your test question should now appear in the list

7. **Test the Like button**
   - Go back to the Employee screen
   - Click the ❤️ heart icon next to your question
   - The like count should increase by 1
   - The heart should change color to show you've liked it
   - On Display, the like count should also increase (refresh to see it)

8. **Mark as Answered**
   - Go back to Admin and click the **"Answered"** tab
   - Click **"Mark as Answered"** next to your question
   - The question should disappear from the Display screen

9. **Export to Excel**
   - On the Admin screen, click the **Export** button at the top
   - A file should download to your computer
   - Open it to make sure all questions (including your test one) are listed with their status and like counts

### Did Everything Work?

- ✅ Display showed the QR code
- ✅ Employee screen let you submit a question
- ✅ Admin screen let you approve it
- ✅ Approved question appeared on Display
- ✅ Like button worked
- ✅ Mark as Answered hid the question from Display
- ✅ Excel export included all questions

If all of these passed, the app is ready for the event.

If something failed, take a screenshot and contact your developer with details.

---

## Step 6: Day-of-Event Checklist

1. **Morning of 07/10:**
   - Test the app again with 2–3 phones to make sure it still works
   - Open Display screen on the projector/TV — let it stay on (it auto-updates)

2. **As the event starts:**
   - Employees scan the QR code and start submitting questions
   - Watch the Admin screen on your phone to approve questions as they come in
   - Questions automatically appear on Display as you approve them

3. **During Q&A session:**
   - Keep approving questions from the Admin screen
   - As organizers answer questions, mark them as "Answered" in Admin
   - Answered questions disappear from Display so the audience sees only unanswered ones

4. **After the event:**
   - Click **Export** in Admin to download an Excel file with all questions, likes, and answers for your records

---

## Important Security Notes

- **Keep your ADMIN_SECRET_TOKEN very secret.** Anyone with this link can approve/reject questions. Do not share the full admin URL in emails or public messages.
- **The Employee screen has no password.** Anyone at the event can submit questions. That's by design — questions are anonymous.
- **The Database URL is also a secret.** Do not share it. Store it safely in Vercel's settings only.

---

## If Something Goes Wrong

### The app won't load
- Check that you set both environment variables (DATABASE_URL and ADMIN_SECRET_TOKEN) in Vercel settings
- Wait a few minutes after clicking Deploy — Vercel takes time to build

### Questions don't save
- The database might not be connected. Check that DATABASE_URL is correct in Vercel settings (no typos)
- Make sure you ran the schema.sql file in the database console

### The QR code doesn't work
- The QR code is generated from your live domain. Make sure you're reading it from the Display screen that's showing your actual Vercel domain

### Admin screen shows "Unauthorized"
- Check that your admin URL includes the full token at the end (everything you generated in Step 2)
- Make sure the token in the URL matches exactly what you set in Vercel's ADMIN_SECRET_TOKEN variable

### Still stuck?
Contact your developer with:
1. The error message you see (take a screenshot)
2. Which steps you've completed
3. Your Vercel project name and domain

---

## More Information

- **App GitHub repo:** https://github.com/dattran1551/Voting-poll-app
- **Design:** Built with Next.js, React, TypeScript, and styled with Tailwind CSS
- **Event details:** VNGGames ON, 07/10/2026, ~500 employees
