# Communication Officer Assessment Guide

## Before a session

1. Open the academy home screen.
2. Select **Reset session** if a previous attendee's answers are visible.
3. Confirm the header says **Assessment system online**.

Below the assessment briefing, the home screen has a **Community channels** block with two QR codes: **Join us on Slack** (Wasatch AppSec / OWASP Salt Lake City) and the **AppSec Pro Bono Initiative** for organizations.

## Assessment flow

Attendees answer ten questions about the OWASP Foundation and OWASP Salt Lake City / Wasatch AppSec. Responses save automatically within the current browser tab. They can move between questions in any order, review all selections, and submit only after all questions are answered.

Questions 4, 5, and 7 say **Select all that apply**. Those items receive credit only when every correct answer and no incorrect answer is selected.

After submission, the results screen shows the score and a question-by-question answer ledger. Missed questions include both the attendee's response and the correct response.

Attendees who score 90% or better also receive the Hackers Challenge token on the results screen. The copy button uses the same token presentation as the Cadet Academy.

Every results screen, at any score, also shows a **Meet us in person** QR code for the OWASP Salt Lake City Meetup page, just above **Review responses**.

## Shared stations

Use **Start new session** on the results screen, or **Reset session** in the header, between attendees. State is stored only in `sessionStorage`, so closing the tab also removes it. No response data leaves the browser.

## Content note

Question 6 reproduces the source PDF's dated meeting information: November 18, SAINTCON 2026 Recap, location TBD. Review and update `js/questions.js` when event details change.
