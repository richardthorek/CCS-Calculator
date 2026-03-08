# User Guide

**CCS Calculator** — Child Care Subsidy estimator for Australian families  
**Version:** 1.0 | **Last Updated:** March 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Entering Your Details](#2-entering-your-details)
   - [Parent Income](#21-parent-income)
   - [Work Schedule](#22-work-schedule)
   - [Adding a Second Parent](#23-adding-a-second-parent)
   - [Children](#24-children)
   - [CCS Settings (Withholding Rate)](#25-ccs-settings-withholding-rate)
3. [Reading Your Results](#3-reading-your-results)
4. [Comparing Scenarios](#4-comparing-scenarios)
5. [Charts and Visualisations](#5-charts-and-visualisations)
6. [Exporting and Sharing](#6-exporting-and-sharing)
7. [Signing In for Cross-Device Sync](#7-signing-in-for-cross-device-sync)
8. [Managing Your Data](#8-managing-your-data)
9. [Presets](#9-presets)
10. [Frequently Asked Questions](#10-frequently-asked-questions)

---

## 1. Getting Started

Open the calculator in your browser. No installation, registration, or login is required to use the core features.

**Quick start:**
1. Select a **preset** (e.g. "Both Parents Full-Time") to pre-fill example values, or enter your own.
2. Fill in your **income** and **work schedule**.
3. Add one or more **children** with their care type and fee.
4. Your estimated CCS and out-of-pocket costs update automatically in the **Results** panel on the right.

The calculator works entirely offline — all data is stored in your browser until you sign in.

---

## 2. Entering Your Details

### 2.1 Parent Income

| Field | Description |
|-------|-------------|
| **Annual Income (FTE)** | Your total family taxable income for the current financial year (before tax). Enter the full-time-equivalent figure — the calculator uses the combined household income to determine your CCS rate. |

**Tips:**
- Use your best estimate if the year is in progress. The calculator applies 2025–26 Australian Government income thresholds.
- Include all family income sources (salary, wages, investments, government payments above the threshold).
- Leave a parent's income at `$0` if they are not working or you only have one income.

### 2.2 Work Schedule

| Field | Description |
|-------|-------------|
| **Days per Week** | How many days per week this parent works (or studies). Used to calculate the Activity Test result. |
| **Hours per Day** | Average hours per working day. Together with days per week, this determines your total fortnightly activity hours. |
| **Work Days** | Checkboxes for the specific days of the week worked. Used to match childcare days to work days in scenarios. |

**Activity Test explained:**  
The Activity Test determines how many subsidised hours of childcare you are entitled to per fortnight:

| Fortnightly Activity Hours | Subsidised Childcare Hours |
|---------------------------|---------------------------|
| 0 (no activity) | 0 |
| 1–8 | 36 |
| 9–16 | 72 |
| 17+ | 100 |

### 2.3 Adding a Second Parent

Click **"Add Parent 2"** to enter details for a second parent/carer. The household income and combined Activity Test result will be recalculated automatically.

Remove the second parent by clicking **"Remove Parent 2"**.

### 2.4 Children

Click **"Add Child"** to add a child. For each child, specify:

| Field | Description |
|-------|-------------|
| **Care Type** | The ACCS-approved care type (Long Day Care, Family Day Care, Outside School Hours Care, etc.). Each type has a different hourly rate cap under CCS rules. |
| **Days in Care per Week** | How many days per week this child attends care. |
| **Daily Fee ($)** | The full daily fee charged by the provider (before subsidy). |
| **Child Age** | Used for "Higher Subsidy" eligibility checks (children aged 5 and under may attract higher rates). |

You can add multiple children. Each child's CCS is calculated separately based on the family income and Activity Test.

### 2.5 CCS Settings (Withholding Rate)

The Australian Government withholds a portion of CCS by default. The default withholding rate is **5%** but you can adjust this from 0% to 100%.

| Setting | Effect |
|---------|--------|
| **0% withholding** | Full CCS paid directly to provider; zero lump-sum at tax time. Higher risk of owing money if income estimate is too low. |
| **5% withholding (default)** | Small buffer against income changes. Small lump sum returned at tax time if income was overestimated. |
| **Higher withholding** | Larger buffer; larger tax return. Useful if your income is uncertain. |

---

## 3. Reading Your Results

The **Results panel** (right side on desktop, below inputs on mobile) updates live as you type.

### Key Figures

| Figure | What It Means |
|--------|---------------|
| **Out-of-Pocket** | What you pay the childcare provider after CCS is applied. This is your actual family cost. |
| **CCS Subsidy** | Total subsidy the government pays on your behalf (after withholding). |
| **Full Cost** | The total childcare fee before any subsidy. |

### Subsidy Breakdown

| Line | What It Means |
|------|---------------|
| **Gross Subsidy** | Total CCS entitlement at your income/activity level (before withholding). |
| **Withholding** | Amount held back by government (default 5%). Returned at tax time. |
| **Net Subsidy Paid** | Amount actually paid to provider (Gross minus Withholding). |

### Summary Row

- **Combined Income** — The household income used for the CCS rate calculation.
- **CCS Rate** — Your percentage subsidy (0%–90%) based on income tier.
- **Subsidised Hours** — Fortnightly hours covered by CCS (36, 72, or 100).
- **Care Days** — Total days per week across all children.

### Changing the Period

Use the **Period Selector** (Weekly / Fortnightly / Monthly / Annual) to view all figures in the time period that suits you.

---

## 4. Comparing Scenarios

The **Scenario Comparison** section shows what happens to your costs if you change your work arrangements.

- **Key Scenarios** — Most relevant combinations (e.g. ±1 day of work per week).
- **More Scenarios** — An extended set covering a wider range.
- **All Scenarios** — Every combination in a sortable full table.

Each scenario card shows:
- Work days for each parent
- Out-of-pocket childcare cost
- Net income after childcare
- Subsidy received

### Sorting the Full Table

In the **All Scenarios** view, use the **Sort by** dropdown to order by:
- Net Income (highest first)
- Out-of-Pocket (lowest first)
- Subsidy (highest first)
- Work Days

### Adjustable Variables Panel

The **Adjustable Variables** panel (above the results) lets you quickly change a single variable — such as a fee or income — and see the impact across all scenarios without re-entering all your data.

---

## 5. Charts and Visualisations

Click **"Show Charts"** in the Visual Comparison section to display:

- **Bar Chart** — Net income after childcare for each work scenario. Quickly see which arrangement leaves your family best off.
- **Doughnut Chart** — Breakdown of your total childcare cost (out-of-pocket vs. subsidy).

Charts update automatically when you change inputs.

---

## 6. Exporting and Sharing

### Export to CSV

Click **"Export CSV"** to download all your scenario data as a spreadsheet. Open in Excel, Google Sheets, or Numbers.

### Print / Save as PDF

Click **"Print"** or use your browser's print function (Ctrl+P / Cmd+P). The page is formatted to print cleanly. Select "Save as PDF" in the print dialog for a PDF copy.

### Share via URL

Click **"Share"** to copy a URL that encodes your current inputs. Paste the link to share with a partner, financial advisor, or employer. The recipient opens the link and sees your exact inputs pre-filled.

---

## 7. Signing In for Cross-Device Sync

Signing in is **optional**. All features work without an account.

### Why Sign In?

- Access your calculator inputs from any device (phone, work computer, tablet).
- Your data is automatically saved after every change (3-second debounce).
- Never lose data when you clear your browser.

### How to Sign In

1. Click **"💾 Sign in"** in the top-right corner.
2. Choose **Microsoft** or **GitHub** as your identity provider.
3. Authorise the app. You are redirected back to the calculator and your data begins syncing.

### Sync Status Indicators

| Status | Meaning |
|--------|---------|
| **Saving…** | Changes are being sent to the cloud. |
| **Synced ✓** | All changes have been saved successfully. |
| **Sync Error ⚠** | A network or server error occurred. Changes are saved locally and will retry. |
| **Conflict ⚠** | Another device saved different data at the same time. The most recent server version is used. |

### Offline Mode

If your internet connection drops, the calculator continues to work using local storage. Changes are synced when you come back online.

---

## 8. Managing Your Data

### Clear All Local Data

Click **"Clear Data"** in the form actions section to wipe all locally stored inputs. This cannot be undone.

### Delete Cloud Account Data

1. Sign in to the calculator.
2. Click your name in the top-right to open the account menu.
3. Click **"Sign Out"** to end your session.
4. To request permanent deletion of all cloud data, open a [GitHub issue](https://github.com/richardthorek/CCS-Calculator/issues/new?title=Data+Deletion+Request&body=Please+delete+all+data+associated+with+my+account.) titled *"Data Deletion Request"*. Your data will be removed within 30 days.

See the [Privacy Policy](../src/privacy.html) for full details on data handling.

---

## 9. Presets

The **Quick Start** preset selector pre-fills common scenarios to help you get started quickly:

| Preset | Description |
|--------|-------------|
| Both Parents Full-Time | Dual-income, 5 days/week each |
| One Parent Part-Time | One full-time, one part-time (3 days/week) |
| Single Parent Full-Time | Single carer, full-time work |
| Single Parent Part-Time | Single carer, 3 days/week |
| High Income Family | Above CCS income threshold |
| Stay-At-Home Parent | One income, other parent at home |

Selecting a preset overwrites current inputs. You can modify any field after selecting a preset.

---

## 10. Frequently Asked Questions

**Is this calculator official?**  
No. This is an independent estimation tool. Results are based on publicly available 2025–26 Australian Government CCS rates. For official calculations, visit [Services Australia](https://www.servicesaustralia.gov.au/child-care-subsidy).

**How accurate are the results?**  
Results are estimates. Actual CCS depends on your confirmed income, provider approvals, and other factors assessed by Services Australia. Use this tool for planning purposes only.

**What is the CCS income threshold?**  
For 2025–26, families earning above approximately $357,000 per year receive 0% CCS. The maximum CCS rate of 90% applies to families earning below approximately $80,000 per year. Exact thresholds are published by the Department of Education.

**Why is my CCS rate lower than expected?**  
Check that your Activity Test hours are correct. If either parent works fewer than 8 hours per fortnight, your entitlement may be 0 subsidised hours. Also check that the care type is correct — different care types have different hourly rate caps.

**Can I use this on my phone?**  
Yes. The calculator is fully responsive and works on iOS and Android browsers.

**My data disappeared — what happened?**  
If you are not signed in, data is stored in browser localStorage. Clearing your browser data, opening in a private/incognito window, or switching browsers will result in a blank form. Sign in for persistent cloud storage.

**Is my income data secure?**  
Without signing in, your data never leaves your device. When signed in, data is encrypted in transit (HTTPS) and at rest (Azure Table Storage). We do not use your data for any purpose other than syncing your scenarios. See the [Privacy Policy](privacy.html).

---

*For further help, open an issue on [GitHub](https://github.com/richardthorek/CCS-Calculator/issues).*
