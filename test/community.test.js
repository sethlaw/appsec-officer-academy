import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { academyConfig } from "../js/config.js";

const appClient = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const { community } = academyConfig;
const templateSource = (name) => appClient.match(new RegExp(`function ${name}\\(\\) \\{[\\s\\S]*?\\n\\}`))[0];

test("community links point at the Wasatch AppSec Slack, the pro bono form and OWASP SLC Meetup", () => {
  assert.equal(community.slack.url, "https://join.slack.com/t/wasatchappsec/shared_invite/zt-1wgxnyqpt-FgwaUExorcc3o5gbdpFdhw");
  assert.equal(community.proBono.url, "https://forms.gle/WEcJyuawKLobUZn89");
  assert.equal(community.meetup.url, "https://www.meetup.com/owasp-slc/");
});

test("QR images use relative paths that exist, so the portal proxy can serve them", async () => {
  for (const link of Object.values(community)) {
    assert.match(link.image, /^\.\/assets\/qr\/[\w-]+\.svg$/);
    await access(new URL(`../${link.image.slice(2)}`, import.meta.url));
  }
});

test("each QR image was generated for the URL printed beneath it", async () => {
  for (const link of Object.values(community)) {
    const svg = await readFile(new URL(`../${link.image.slice(2)}`, import.meta.url), "utf8");
    assert.ok(svg.includes(`aria-label="QR code: ${link.url}"`), link.label);
  }
});

test("home renders the community tiles after the primary call to action", () => {
  const home = templateSource("homeTemplate");
  assert.ok(home.includes("qrTile(academyConfig.community.slack)"));
  assert.ok(home.includes("qrTile(academyConfig.community.proBono"));
  assert.ok(home.indexOf("${label} &rarr;") < home.indexOf("qrTile("));
});

test("results render the Meetup tile between the CTF award and the results actions", () => {
  const results = templateSource("resultsTemplate");
  const meetup = results.indexOf("qrTile(academyConfig.community.meetup");
  assert.ok(meetup > results.indexOf("${ctfAward}"));
  assert.ok(meetup < results.indexOf("results-actions"));
});
