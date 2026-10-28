export const academyConfig = {
  event: "SAINTCON 26",
  academy: "AppSec Academy",
  program: "Communication Officer Qualification",
  tagline: "Know the community. Share the mission.",
  ctfToken: "HC{APPSEC_OFFICER_COMMUNITY_SIGNAL}",
  ctfMinimumPercent: 90,
  storageKey: "saintcon-appsec-officer-session-v1",
  ranks: ["Cadet", "Navigator", "Communication Officer", "Commander"],
  assets: {
    logo: "./assets/space-owasp.png",
    recruitmentPoster: "./assets/appsec-needs-you.png",
    rankPoster: "./assets/appsec-ranks.png"
  },
  // QR tiles on the home and results screens. Each image is a black-on-white QR code for its
  // url; paths stay relative because the portal serves this app under /communication-officers/.
  community: {
    slack: {
      label: "Join us on Slack",
      note: "Wasatch AppSec / OWASP Salt Lake City",
      url: "https://join.slack.com/t/wasatchappsec/shared_invite/zt-1wgxnyqpt-FgwaUExorcc3o5gbdpFdhw",
      image: "./assets/qr/slack.svg"
    },
    proBono: {
      label: "AppSec Pro Bono Initiative",
      note: "Tell us what your organization needs, and community volunteers will come to you for a round-table with whoever you invite: you bring questions, we bring answers. In return, host or provide lunch for one of our monthly AppSec Community Meetups. Talking about application security makes us hungry.",
      url: "https://forms.gle/WEcJyuawKLobUZn89",
      image: "./assets/qr/pro-bono-form.svg"
    },
    meetup: {
      label: "Meet us in person",
      note: "OWASP Salt Lake City on Meetup",
      url: "https://www.meetup.com/owasp-slc/",
      image: "./assets/qr/meetup.svg"
    }
  },
  timing: {
    thinkingMs: 850,
    wordMinMs: 75,
    wordJitterMs: 55,
    evidenceDelayMs: 500
  },
  theme: {
    ink: "#0c1116",
    panel: "#141b24",
    panelBright: "#1e3034",
    cyan: "#73e5f1",
    teal: "#587d80",
    amber: "#f9c401",
    coral: "#f8781e",
    paper: "#f3e5c3",
    muted: "#d9cba1"
  }
};
