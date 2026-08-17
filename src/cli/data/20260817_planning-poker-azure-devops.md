---
title: Planning Poker with Azure DevOps - How to Estimate Azure Boards Work Items
description: A step-by-step guide to running Planning Poker for your Azure Boards backlog: export your work items, batch add them as rounds, estimate as a team, and bulk-import the story points back into Azure DevOps.
slug: planning-poker-azure-devops
lastUpdated: 2026/08/17
author: Gergely Bihary
coverImageId: topics
coverImageAlt: A graphic showing issues stacked over each other
category: guide
tags: Azure DevOps, Azure Boards, Planning Poker, Story Points, Agile Estimation, Sprint Planning
faqs:[{"question": "Does PlanningPoker.live integrate directly with Azure DevOps?", "answer": "Not currently. Our native integrations are with Jira and Linear. For Azure DevOps you can use the copy-and-paste workflow in this guide: export your work items from an Azure Boards query, batch add them as rounds, then bulk-import the agreed story points back with a CSV."}, {"question": "How do I bulk update story points in Azure DevOps after an estimation session?", "answer": "Export your query to CSV from Azure Boards, fill in the Story Points column with your session results, then go to Boards > Queries > Import work items and upload the file. Keep the ID column populated - Azure DevOps updates an existing work item when a row has an ID, and creates a new one when the ID is empty."}, {"question": "How many work items can I estimate in one session?", "answer": "The Batch add rounds dialog accepts up to 20 topics per paste, and you can paste more than once. In practice 20 items is already a long refinement meeting, so most teams find the limit is not the constraint."}, {"question": "Do all participants need an Azure DevOps license to join?", "answer": "No. Participants join a PlanningPoker.live room through a shared browser link, so contractors, designers, and stakeholders without an Azure DevOps license can take part. This is the main advantage of a standalone room over a Marketplace extension embedded in Azure Boards."}, {"question": "Should I use an Azure DevOps Marketplace extension instead?", "answer": "Use a Marketplace extension if you estimate items one at a time and everyone involved already has an Azure DevOps license. Use a standalone room if you estimate in batches during scheduled refinement, need people without licenses to join, or want participants joining from a phone or a video call overlay."}]
---
### Introduction

Azure DevOps gives you a Story Points field on every work item, but it gives you no way to *agree* on what goes in it. The number gets typed in by whoever opens the item first, or gets decided by the loudest voice in the room — which is exactly the failure mode Planning Poker was invented to prevent.

This guide shows you how to run a proper consensus estimation session for your Azure Boards backlog using [PlanningPoker.live](https://planningpoker.live), and how to push the agreed estimates back into Azure DevOps in bulk. The whole loop takes about two minutes of setup per session.

PlanningPoker.live does not currently have a native Azure DevOps integration — our direct integrations are with [Jira](https://planningpoker.live/integrations/jira) and [Linear](https://planningpoker.live/integrations/linear). What follows is a copy-and-paste workflow that works today, and for most teams it is fast enough that the missing integration never becomes a bottleneck.

### What you'll need

- An Azure DevOps project with work items in Azure Boards
- Permission to run and edit queries in Azure Boards
- A PlanningPoker.live room — no account is required to start one

### Step 1: Pull the work items you want to estimate

In Azure Boards, create a query that returns the items going into your next sprint. A typical refinement query filters on **Area Path**, **Iteration Path**, and **State = New**, and returns the **ID** and **Title** columns.

Once the query is running, you have two ways to get the list out:

**Option A — Copy as HTML (fastest).** Multi-select the work items in the query results with `Shift+Click` or `Ctrl+Click`, open the **More actions** menu next to any selected row, and choose **Copy as HTML**. This puts a formatted table of the selected items on your clipboard, with the ID and title of each.

**Option B — Export to CSV (better if you want to write estimates back).** From the query results, open the **actions** menu and choose **Export to CSV**. This is the option to use if you plan to bulk-update the story points afterwards, because the exported file already contains the work item IDs you'll need in Step 4.

### Step 2: Batch add the items as rounds

Open your PlanningPoker.live room and find the **Import/export** dropdown at the top of the topics sidebar. Choose **Batch add rounds**.

Paste your work items into the textarea, one per line. A new estimation round is created for each line, so a list like this creates three rounds:

```
1042: Add rate limiting to the public API
1043: Migrate session storage to Redis
1044: Fix flaky checkout integration test
```

Keeping the work item ID at the front of each line is the single most useful thing you can do here. It makes the round titles unambiguous during the session, and it makes matching estimates back to Azure DevOps trivial in Step 4.

A few practical notes:

- **You can add up to 20 rounds per paste.** If your refinement session covers more than that, do it in two batches — or better, split the session. Twenty items is already a long refinement meeting.
- Empty lines are ignored, so you don't need to clean up trailing whitespace.
- If you used **Copy as HTML** in Step 1, paste into a plain-text editor first to strip the formatting, then trim to one item per line.

### Step 3: Run the estimation session

Share the room link with your team. Everyone joins in their browser — no installs, no accounts.

For each round, the team votes privately, then all cards are revealed at once. This simultaneity is the entire point: it prevents anchoring, where the first number spoken aloud drags every subsequent estimate toward it.

A few things worth using during the session:

- **Pick a card set that matches how your team already estimates.** If your Azure DevOps Story Points field holds Fibonacci values, use the Fibonacci deck so the numbers transfer directly with no conversion step.
- **Discuss the outliers, not the average.** When the highest and lowest cards are far apart, that gap is information — usually it means someone knows about a complication the rest of the team doesn't. Ask them first.
- **Re-vote after the discussion.** One round of discussion followed by a second vote resolves most disagreements.

### Step 4: Write the estimates back to Azure DevOps

This is where the CSV export from Step 1 pays off.

When the session ends, use **Import/export → Download as .csv** in PlanningPoker.live to export your results. You now have the agreed estimate for every round, with the work item ID at the front of each title.

To bulk-update Azure DevOps:

1. Open the CSV you exported from Azure Boards in Step 1. It contains an **ID** column.
2. Add or fill in the **Story Points** column using the results from your session.
3. Save the file, then in Azure Boards go to **Boards → Queries → Import work items** and select your file.

The important detail: **keep the ID column intact and populated.** Azure DevOps uses the presence of an ID to decide whether it is updating an existing work item or creating a new one. Rows with an ID update that item in place. Rows with an empty ID create brand-new work items — which is how teams accidentally end up with a duplicate backlog.

For a handful of items, skipping the CSV entirely and bulk-editing directly in the query results grid is often faster. The CSV route wins once you're updating more than about ten items.

### Limitations to be aware of

Being direct about what this workflow does not do:

- **There is no automatic write-back.** Estimates do not sync to Azure DevOps on their own; Step 4 is a manual action you take once per session.
- **Twenty rounds per batch add.** Larger backlogs need multiple pastes.
- **No live link to the work item.** Rounds are plain text, so you won't get the description, acceptance criteria, or state rendered inside the estimation room the way you would with our native Jira and Linear integrations. Keep Azure Boards open in a second tab during refinement.

If those constraints matter to your team, the Azure DevOps Marketplace has extensions that embed estimation directly into Azure Boards. They trade the flexibility of a standalone room — anyone can join by link, including people without an Azure DevOps license — for tighter integration.

### Which approach should you pick?

Use the copy-and-paste workflow above if your team estimates in batches during a scheduled refinement meeting, if you have participants without Azure DevOps licenses (contractors, designers, stakeholders), or if you want people joining from a phone or a video call overlay.

Use a Marketplace extension if you estimate items one at a time as they come up, and everyone involved already has an Azure DevOps license.

### Summary

Azure DevOps has no built-in consensus estimation, but you don't need one to run good Planning Poker sessions against your Azure Boards backlog. Export your query, batch add the items as rounds, estimate as a team, then bulk-import the story points back with the ID column intact. Two copy-paste operations bracket a session that otherwise runs exactly as it should.

[Start a free estimation session](https://planningpoker.live/create) — no signup required.
