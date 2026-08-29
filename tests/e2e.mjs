import { chromium } from "playwright";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
initializeApp({ projectId: "voting-d984b" });

const BASE = "http://localhost:3000";
const auth = getAuth();
const fs = getFirestore();

const results = [];
function check(name, cond, extra = "") {
  const ok = !!cond;
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${extra ? " :: " + extra : ""}`);
}

const TEST_PASSWORD = "Test1234!";

async function makeUser(email) {
  const uid = email.replace(/[^a-zA-Z0-9]/g, "_");
  try {
    await auth.createUser({ uid, email, emailVerified: true, password: TEST_PASSWORD, displayName: email.split("@")[0] });
  } catch (_) {
    /* already exists */
  }
  return email;
}

async function login(page, email) {
  await makeUser(email);
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.__signInWithPassword, null, { timeout: 20000 });
  await page.evaluate(([e, p]) => window.__signInWithPassword(e, p), [email, TEST_PASSWORD]);
  try {
    await page.waitForFunction(
      () => ["/admin", "/teacher", "/candidate", "/student"].includes(location.pathname),
      null,
      { timeout: 20000 }
    );
  } catch { /* sign-in succeeded; routing may still be resolving */ }
}

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
  page.on("response", async (r) => {
    if (r.status() === 403) console.log("  [403 body]", (await r.text()).slice(0, 200));
  });
  return page;
}

async function newMobilePage(browser) {
  const ctx = await browser.newContext({ 
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  [mobile pageerror]", e.message));
  page.on("response", async (r) => {
    if (r.status() === 403) console.log("  [mobile 403 body]", (await r.text()).slice(0, 200));
  });
  return page;
}

async function seed() {
  await fs.collection("teacherProfiles").doc("teachertest@gmail.com").set({
    active: true,
    displayName: "Test Teacher",
    email: "teachertest@gmail.com",
    uid: "",
    createdAt: Date.now()
  });
  await fs.collection("candidateEmails").doc("candidatetest@gmail.com").set({ email: "candidatetest@gmail.com", uid: "" });

  const seedNow = Date.now();
  await fs.collection("users").doc("teachertest_gmail_com").set({
    uid: "teachertest_gmail_com", email: "teachertest@gmail.com", displayName: "teachertest",
    photoURL: "", role: "teacher", createdAt: seedNow, updatedAt: seedNow
  });
  await fs.collection("users").doc("candidatetest_gmail_com").set({
    uid: "candidatetest_gmail_com", email: "candidatetest@gmail.com", displayName: "candidatetest",
    photoURL: "", role: "candidate", createdAt: seedNow, updatedAt: seedNow
  });
  await fs.collection("users").doc("studenttest_gmail_com").set({
    uid: "studenttest_gmail_com", email: "studenttest@gmail.com", displayName: "studenttest",
    photoURL: "", role: "student", createdAt: seedNow, updatedAt: seedNow
  });

  const eid = "test-election";
  const now = Date.now();
  await fs
    .collection("elections")
    .doc(eid)
    .set({
      id: eid,
      name: "Selenium Live Election",
      className: "BBA",
      section: "B",
      description: "",
      gender: "Mixed",
      startTime: now - 3600_000,
      endTime: now + 86400_000,
      resultTime: now - 60_000,
      eligibilityMode: "open",
      studentWeight: 70,
      authorityWeightEach: 10,
      authority: { hodEmail: "hodtest@gmail.com", coordinatorEmail: "coordtest@gmail.com", counsellorEmail: "counstest@gmail.com" },
      createdBy: "seed-admin",
      finalized: false
    });
  await fs.collection("elections").doc(eid).collection("candidates").doc("cand-male").set({
    uid: "cand-male",
    name: "Arjun Male",
    gender: "Male",
    candidateCode: "AAAAA",
    promises: ["Transparency"],
    photoUrl: "",
    enrolledAt: now
  });
  await fs.collection("elections").doc(eid).collection("candidates").doc("cand-female").set({
    uid: "cand-female",
    name: "Meera Female",
    gender: "Female",
    candidateCode: "BBBBB",
    promises: ["Accountability"],
    photoUrl: "",
    enrolledAt: now
  });

  const existingVotes = await fs.collection("elections").doc(eid).collection("votes").get();
  for (const doc of existingVotes.docs) {
    await doc.ref.delete();
  }
  console.log("seed complete");
}

async function main() {
  await seed();
  const browser = await chromium.launch();

  try {
    // ---- Public pages ----
    {
      const page = await newPage(browser);
      await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
      const body = await page.textContent("body");
      check("Landing page renders", /DSCASC|Election/i.test(body || ""));
      await page.goto(BASE + "/guidelines", { waitUntil: "domcontentloaded" });
      check("Guidelines page loads", (await page.textContent("body"))?.length > 50);
      await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
      const googleBtn = await page
        .getByText("Continue with Google")
        .waitFor({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      check("Login page shows Google button", googleBtn);
      await page.close();
    }

    // ---- Admin ----
    {
      const page = await newPage(browser);
      await login(page, "powrrskanda@gmail.com");
      check("Admin routed to /admin", page.url().includes("/admin"));
      check("Admin dashboard renders", await page.getByText("Admin Dashboard").count() > 0);
      await page.close();
    }

    // ---- Teacher ----
    {
      const page = await newPage(browser);
      await login(page, "teachertest@gmail.com");
      check("Teacher routed to /teacher", page.url().includes("/teacher"));
      check("Teacher dashboard renders", await page.getByText("Teacher Dashboard").count() > 0);
      await page.close();
    }

    // ---- Candidate completes profile ----
    let candidateCode = "";
    {
      const page = await newPage(browser);
      await login(page, "candidatetest@gmail.com");
      check("Candidate routed to /candidate", page.url().includes("/candidate"));
      await page.getByText("Candidate Dashboard").waitFor({ timeout: 15000 });
      await page.getByRole("button", { name: "Save Profile" }).waitFor({ timeout: 15000 });
      check("Candidate dashboard renders", true);
      const nameInput = page.locator('input:not([type="file"])').first();
      await nameInput.fill("Test Candidate");
      let promiseInput = page.locator('input[placeholder="Promise 1"]');
      if (await promiseInput.count() === 0) {
        await page.getByRole("button", { name: "Add promise" }).click();
        await page.waitForTimeout(500);
        const phs = await page.locator("input").evaluateAll((els) => els.map((e) => e.placeholder));
        console.log("AFTER ADD PROMISE PHs:", JSON.stringify(phs));
        promiseInput = page.locator('input[placeholder="Promise 1"]');
      }
      if (await promiseInput.count() > 0) await promiseInput.fill("I will represent students fairly");
      await page.getByRole("button", { name: "Save Profile" }).click();
      const saved = await page
        .getByText("Profile saved successfully!")
        .waitFor({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (!saved) {
        const msg = await page.locator("body").innerText();
        const html = await page.content();
        console.log("CAND SAVE URL:", page.url());
        console.log("CAND SAVE MSG:", JSON.stringify(msg.slice(0, 200)));
        console.log("CAND SAVE HTML:", html.slice(0, 400));
      }
      check("Candidate profile saved", saved);
      const snap = await fs.collection("candidateProfiles").where("email", "==", "candidatetest@gmail.com").get();
      candidateCode = snap.docs[0]?.data().candidateCode || "";
      check("Candidate code generated", /^[A-Z0-9]{5}$/.test(candidateCode), candidateCode);
      await page.close();
    }

    // ---- Teacher creates election + enrolls candidate ----
    {
      const page = await newPage(browser);
      const fillByLabel = async (scope, label, value) =>
        scope.getByText(label, { exact: true }).locator("..").locator("input").fill(value);
      const pickDate = async (scope, label, day) => {
        const field = scope.getByText(label, { exact: true }).locator("..");
        await field.getByRole("button").first().click();
        const dp = page.getByRole("dialog", { name: `Choose ${label}` });
        await dp.getByRole("button", { name: /go to .*next month/i }).click();
        await dp.getByText(String(day), { exact: true }).first().click();
        await dp.waitFor({ state: "detached", timeout: 5000 }).catch(async () => {
          await page.keyboard.press("Escape");
          await dp.waitFor({ state: "detached", timeout: 3000 }).catch(() => {});
        });
      };
      await login(page, "teachertest@gmail.com");
      await page.getByText("Teacher Dashboard").waitFor({ timeout: 15000 });
      await page.getByRole("button", { name: "Create Election" }).first().click();
      const dlg = page.getByRole("dialog", { name: "Create Election" });
      await dlg.waitFor({ timeout: 10000 });
      await dlg.getByPlaceholder(/I Semester/).fill("Teacher Made Election");
      await fillByLabel(dlg, "Description", "Election created by teacher in E2E");
      await fillByLabel(dlg, "Class", "BBA");
      await fillByLabel(dlg, "Section", "B");
      await pickDate(dlg, "Start (voting opens)", 15);
      await dlg.getByText("Start (voting opens)").locator("..").locator("select").selectOption("09:00");
      await pickDate(dlg, "End (voting closes)", 20);
      await dlg.getByText("End (voting closes)").locator("..").locator("select").selectOption("17:00");
      await pickDate(dlg, "Result Announcement", 25);
      await dlg.getByText("Result Announcement").locator("..").locator("select").selectOption("20:00");
      await fillByLabel(dlg, "Student Weight %", "70");
      await fillByLabel(dlg, "Each Authority %", "10");
      await dlg.getByRole("button", { name: "Create Election" }).click({ force: true, timeout: 15000 });
      const created = await page
        .getByText("Teacher Made Election")
        .first()
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      check("Teacher election created", created);
      // open its Manage page via the election id
      const evSnap = await fs.collection("elections").where("name", "==", "Teacher Made Election").get();
      const docs = evSnap.docs.sort((a, b) => (b.data().createdAt || 0) - (a.data().createdAt || 0));
      const electionId = docs[0]?.id;
      if (!electionId) {
        check("Candidate enrolled", false, "election id not found");
        await page.close();
      } else {
        await page.goto(BASE + "/teacher/election/" + electionId, { waitUntil: "domcontentloaded" });
        await page.getByRole("tab", { name: "Candidates" }).waitFor({ timeout: 15000 });
        await page.getByRole("tab", { name: "Candidates" }).click();
      await page.getByPlaceholder("A7X2K").fill(candidateCode);
      await page.getByRole("button", { name: "Lookup" }).click();
      await page.getByRole("button", { name: "Enroll" }).waitFor({ timeout: 15000 });
      await page.getByRole("button", { name: "Enroll" }).click();
      check("Candidate enrolled", await page.getByText("Test Candidate").waitFor({ timeout: 15000 }).then(() => true).catch(() => false));
        await page.close();
      }
    }

    // ---- Student votes in seeded live election ----
    {
      const page = await newPage(browser);
      await login(page, "studenttest@gmail.com");
      check("Student routed to /student", page.url().includes("/student"));
      await page.goto(BASE + "/election/test-election/vote", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await page.getByText("Arjun Male").click();
      await page.getByText("Meera Female").click();
      await page.getByRole("button", { name: "Submit Vote" }).click();
      await page.getByRole("button", { name: "Confirm & Submit" }).click();
      await page.waitForURL("**/election/test-election/submitted", { timeout: 15000 });
      check("Student vote submitted", page.url().includes("/submitted"));
      // duplicate vote blocked
      await page.goto(BASE + "/election/test-election/vote", { waitUntil: "domcontentloaded" });
      const dup = await page
        .getByText("You have already voted")
        .waitFor({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      check("Duplicate vote blocked", dup);
      await page.close();
    }

    // ---- Admin finalizes + student sees results ----
    {
      const page = await newPage(browser);
      await login(page, "powrrskanda@gmail.com");
      await page.goto(BASE + "/teacher/election/test-election", { waitUntil: "domcontentloaded" });
      await page.getByRole("tab", { name: "Results" }).click();
      await page.getByRole("button", { name: "Calculate Results" }).click();
      await page.getByRole("button", { name: "Finalize" }).waitFor({ timeout: 15000 });
      await page.getByRole("button", { name: "Finalize" }).click();
      await page.getByText("Finalized").waitFor({ timeout: 15000 }).catch(() => {});
      await page.close();

      const sp = await newPage(browser);
      await login(sp, "studenttest@gmail.com");
      await sp.goto(BASE + "/election/test-election/results", { waitUntil: "domcontentloaded" });
      await sp.waitForTimeout(2500);
      const resBody = await sp.textContent("body");
      check("Results revealed to student", /WINNER|Arjun Male|Meera Female/i.test(resBody || ""));
      await sp.close();
    }

    // ---- Mobile flows ----
    {
      const page = await newMobilePage(browser);
      await login(page, "powrrskanda@gmail.com");
      check("Mobile admin routed to /admin", page.url().includes("/admin"));
      check("Mobile admin dashboard renders", await page.getByText("Admin Dashboard").waitFor({ timeout: 15000 }).then(() => true).catch(() => false));
      const adminMenu = await page.getByRole("button", { name: "Toggle menu" }).count();
      check("Mobile admin shows menu button", adminMenu > 0);
      await page.close();
    }
    {
      const page = await newMobilePage(browser);
      await login(page, "teachertest@gmail.com");
      check("Mobile teacher routed to /teacher", page.url().includes("/teacher"));
      check("Mobile teacher dashboard renders", await page.getByText("Teacher Dashboard").waitFor({ timeout: 15000 }).then(() => true).catch(() => false));
      const teacherMenu = await page.getByRole("button", { name: "Toggle menu" }).count();
      check("Mobile teacher shows menu button", teacherMenu > 0);
      await page.close();
    }
    {
      const page = await newMobilePage(browser);
      await login(page, "studenttest@gmail.com");
      check("Mobile student routed to /student", page.url().includes("/student"));
      check("Mobile student dashboard renders", await page.getByText("Student Dashboard").waitFor({ timeout: 15000 }).then(() => true).catch(() => false));
      const studentMenu = await page.getByRole("button", { name: "Toggle menu" }).count();
      check("Mobile student shows menu button", studentMenu > 0);
      await page.close();
    }
    {
      const page = await newMobilePage(browser);
      await login(page, "candidatetest@gmail.com");
      check("Mobile candidate routed to /candidate", page.url().includes("/candidate"));
      check("Mobile candidate dashboard renders", await page.getByText("Candidate Dashboard").waitFor({ timeout: 15000 }).then(() => true).catch(() => false));
      const candMenu = await page.getByRole("button", { name: "Toggle menu" }).count();
      check("Mobile candidate shows menu button", candMenu > 0);
      await page.close();
    }
  } catch (e) {
    console.log("FATAL:", e.message);
    check("Suite completed without fatal error", false, e.message);
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n==== ${passed}/${results.length} checks passed ====`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
