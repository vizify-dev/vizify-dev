export const RESUME_UIUX_CSS = `.resume--uiux {
  display: flex;
  flex-direction: column;
  max-width: 794px;
  min-height: 1123px;
  margin: 0 auto;
  padding: 28px 48px 24px;
  overflow: hidden;
  background: #fff;
  color: #50515a;
  font: 13px/1.45 "Montserrat", Arial, sans-serif;
}

.resume--uiux .r-head {
  position: relative;
  display: grid;
  flex: none;
  grid-template-columns: 190px minmax(0, 1fr);
  grid-template-rows: 190px auto;
  column-gap: 22px;
  align-items: center;
  min-height: 275px;
  margin-bottom: 12px;
}
.resume--uiux .r-head::before {
  position: absolute;
  top: 20px;
  left: 220px;
  color: #090a0d;
  content: "UI/UX";
  font: 900 106px/0.95 "Arial Black", "Montserrat", Arial, sans-serif;
  letter-spacing: -0.07em;
  white-space: nowrap;
}
.resume--uiux .r-head::after {
  position: absolute;
  top: 133px;
  left: 242px;
  color: #17181b;
  content: "DESIGNER";
  font: 800 36px/1 "Montserrat", Arial, sans-serif;
  letter-spacing: -0.04em;
}
.resume--uiux .r-uiux-stickers { position: absolute; z-index: 3; inset: 0; pointer-events: none; }
.resume--uiux .r-sticker { position: absolute; display: block; }
.resume--uiux .r-airplane { top: 57px; left: 202px; font-size: 27px; transform: rotate(-15deg); }
.resume--uiux .r-cap { top: -12px; left: 135px; font-size: 40px; transform: rotate(-18deg); }
.resume--uiux .r-leaf { top: 75px; left: 352px; font-size: 23px; transform: rotate(-18deg); }
.resume--uiux .r-eyes { top: 46px; left: 410px; font-size: 27px; transform: rotate(8deg); }
.resume--uiux .r-tongue { top: 113px; left: 444px; font-size: 24px; transform: rotate(5deg); }
.resume--uiux .r-bubble { top: 108px; right: 132px; font-size: 27px; }
.resume--uiux .r-resume, .resume--uiux .r-creative, .resume--uiux .r-btech, .resume--uiux .r-date {
  padding: 5px 12px;
  border-radius: 999px;
  color: #363743;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
}
.resume--uiux .r-resume { top: 47px; right: 37px; background: #dcb0f3; transform: rotate(-4deg); }
.resume--uiux .r-creative { top: 155px; right: 38px; background: #e8ff9c; transform: rotate(-12deg); }
.resume--uiux .r-date { top: 140px; left: 218px; background: #fff0a8; transform: rotate(3deg); }
.resume--uiux .r-btech { top: 184px; left: 382px; background: #d2b7fa; transform: rotate(-3deg); }
.resume--uiux .r-confetti { top: 225px; right: 14px; color: #e13d79; font-size: 30px; letter-spacing: 8px; transform: rotate(-20deg); }
.resume--uiux .r-ribbon { font-size: 42px; font-weight: 700; line-height: 1; }
.resume--uiux .r-ribbon-blue { top: 236px; left: -20px; color: #199ed7; transform: rotate(65deg); }
.resume--uiux .r-ribbon-pink { top: 249px; left: 365px; color: #e22b7b; transform: rotate(-50deg); }
.resume--uiux .r-photo {
  display: block;
  grid-area: 1 / 1;
  align-self: start;
  width: 176px;
  height: 190px;
  border: 5px solid #f4efdf;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 5px 16px rgba(30, 41, 59, 0.14);
}
.resume--uiux .r-id {
  grid-area: 2 / 1 / 3 / -1;
  align-self: start;
  padding-top: 8px;
}
.resume--uiux .r-id h1 {
  margin: 0;
  color: #3279d5;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
}
.resume--uiux .r-id h1::after { content: none; }
.resume--uiux .r-role {
  margin: 5px 0 0;
  color: #565963;
  font-size: 15px;
}
.resume--uiux .r-head .r-contact { display: none; }

.resume--uiux .r-uiux-grid {
  display: grid;
  flex: 1;
  grid-template-columns: 1.2fr 0.8fr;
  grid-template-areas:
    "about contact"
    "education experience"
    "projects projects";
  align-content: start;
  align-items: start;
  gap: 18px;
}
.resume--uiux .r-sec {
  position: relative;
  min-width: 0;
  margin: 0;
  padding: 16px 18px 18px;
  border: 1px solid #e8e9ed;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 7px 17px rgba(39, 43, 52, 0.1);
}
.resume--uiux .r-sec[data-s="about"] { grid-area: about; }
.resume--uiux .r-sec[data-s="contact"] { display: block; grid-area: contact; }
.resume--uiux .r-sec[data-s="education"] { grid-area: education; }
.resume--uiux .r-sec[data-s="experience"] { grid-area: experience; }
.resume--uiux .r-sec[data-s="projects"] {
  grid-area: projects;
  padding-right: 190px;
}
.resume--uiux .r-sec[data-s="projects"]::after {
  position: absolute;
  top: 38px;
  right: 22px;
  display: grid;
  width: 150px;
  min-height: 64px;
  place-content: center;
  border-radius: 16px 16px 16px 4px;
  background: #e8ff9c;
  color: #363b2d;
  content: "100+ Projects\\A Completed";
  font-size: 17px;
  line-height: 1.3;
  text-align: center;
  white-space: pre;
}
.resume--uiux .r-sec[data-s="about"]::before,
.resume--uiux .r-sec[data-s="education"]::after,
.resume--uiux .r-sec[data-s="experience"]::after {
  position: absolute;
  z-index: 2;
  color: #df2874;
  content: "〰";
  font-size: 38px;
  line-height: 1;
}
.resume--uiux .r-sec[data-s="about"]::before { top: -17px; left: -19px; color: #1c9bd4; transform: rotate(65deg); }
.resume--uiux .r-sec[data-s="about"]::after { top: -21px; right: 16px; }
.resume--uiux .r-sec[data-s="education"]::after { right: 12px; bottom: -19px; transform: rotate(-45deg); }
.resume--uiux .r-sec[data-s="contact"]::after {
  position: absolute;
  top: -35px;
  right: 8px;
  color: #e4a528;
  content: "✦ ✧ ✦";
  font-size: 23px;
  letter-spacing: 4px;
  transform: rotate(-24deg);
}
.resume--uiux .r-sec[data-s="skills"] { display: none; }
.resume--uiux .r-sec[data-s="languages"],
.resume--uiux .r-sec[data-s="references"],
.resume--uiux .r-sec[data-s="other"] { grid-column: 1 / -1; }
.resume--uiux .r-sec h2 {
  display: inline-block;
  margin: 0 0 12px;
  padding: 4px 12px;
  border: 1px solid #d5d9df;
  border-radius: 999px;
  color: #424650;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.25;
}
.resume--uiux .r-text { margin: 0; color: #666871; text-align: justify; }

.resume--uiux .r-entry {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  column-gap: 6px;
  margin-bottom: 14px;
  padding-left: 35px;
}
.resume--uiux .r-entry:last-child { margin-bottom: 0; }
.resume--uiux .r-entry::before {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 22px;
  line-height: 1.2;
}
.resume--uiux .r-sec[data-s="education"] .r-entry::before { content: "🎓"; }
.resume--uiux .r-sec[data-s="experience"] .r-entry::before { content: "👉"; }
.resume--uiux .r-sec[data-s="projects"] .r-entry::before { content: "💭"; }
.resume--uiux .r-line { display: contents; }
.resume--uiux .r-title {
  order: 1;
  flex-basis: 100%;
  color: #3478d4;
  font-size: 15px;
  font-weight: 700;
}
.resume--uiux .r-sub, .resume--uiux .r-date { color: #575963; font-size: 12px; }
.resume--uiux .r-sub { order: 2; }
.resume--uiux .r-date { order: 3; }
.resume--uiux .r-entry:has(.r-sub) .r-date::before { content: "| "; }
.resume--uiux .r-bullets {
  order: 4;
  flex-basis: 100%;
  margin: 3px 0 0;
  padding: 0;
  list-style: none;
  color: #5e6069;
  font-size: 11.5px;
}
.resume--uiux .r-bullets li { margin-top: 3px; }
.resume--uiux .r-bullets li::before { content: "• "; }
.resume--uiux .r-clist { margin: 0; padding: 0; list-style: none; }
.resume--uiux .r-clist li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.resume--uiux .r-clist li:last-child { margin-bottom: 0; }
.resume--uiux .r-clist svg { display: block; width: 22px; height: 22px; flex: none; color: #89909a; }
.resume--uiux .r-uiux-socials { display: flex; justify-content: space-between; gap: 12px; margin: auto 28px 0; padding-top: 24px; }
.resume--uiux .r-uiux-socials span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 9px;
  color: #fff;
  font: 700 18px/1 Arial, sans-serif;
  box-shadow: 0 3px 8px rgba(30, 41, 59, 0.14);
}
.resume--uiux .r-social-behance { background: #1769ff; }
.resume--uiux .r-social-dribbble { background: #e94b89; }
.resume--uiux .r-social-linkedin { background: #0a66c2; }
.resume--uiux .r-social-gmail { background: #262626; }
.resume--uiux .r-social-instagram { background: linear-gradient(135deg, #f8c044, #df397e, #7045c5); }
.resume--uiux .r-social-figma { background: #171717; }
.resume--uiux .r-social-pinterest { background: #bd081c; }

@media (max-width: 640px) {
  .resume--uiux { min-height: 0; padding: 22px 18px; }
  .resume--uiux .r-head {
    grid-template-columns: 112px minmax(0, 1fr);
    grid-template-rows: 125px auto;
    column-gap: 14px;
    min-height: 205px;
  }
  .resume--uiux .r-head::before { top: 18px; left: 130px; font-size: 54px; }
  .resume--uiux .r-head::after { top: 78px; left: 144px; font-size: 20px; }
  .resume--uiux .r-cap { top: -9px; left: 90px; font-size: 28px; }
  .resume--uiux .r-airplane { top: 62px; left: 128px; font-size: 19px; }
  .resume--uiux .r-leaf { top: 50px; left: 205px; font-size: 16px; }
  .resume--uiux .r-eyes { top: 37px; left: 226px; font-size: 17px; }
  .resume--uiux .r-tongue { top: 73px; left: 242px; font-size: 16px; }
  .resume--uiux .r-bubble { top: 82px; right: 3px; font-size: 19px; }
  .resume--uiux .r-resume, .resume--uiux .r-creative, .resume--uiux .r-btech, .resume--uiux .r-date { padding: 3px 7px; font-size: 10px; }
  .resume--uiux .r-resume { top: 19px; right: 0; }
  .resume--uiux .r-creative { top: 107px; right: 0; }
  .resume--uiux .r-date { top: 102px; left: 127px; }
  .resume--uiux .r-btech { top: 133px; left: 203px; }
  .resume--uiux .r-confetti { top: 190px; right: 0; font-size: 21px; }
  .resume--uiux .r-ribbon { display: none; }
  .resume--uiux .r-photo { width: 108px; height: 122px; border-radius: 18px; }
  .resume--uiux .r-id h1 { font-size: 24px; }
  .resume--uiux .r-role { font-size: 12px; }
  .resume--uiux .r-uiux-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "about" "contact" "education" "experience" "projects";
    gap: 14px;
  }
  .resume--uiux .r-sec[data-s="projects"] { padding-right: 18px; }
  .resume--uiux .r-sec[data-s="projects"]::after { position: static; width: 140px; min-height: 52px; margin: 12px 0 0 auto; }
  .resume--uiux .r-uiux-socials { margin: 0 12px; }
  .resume--uiux .r-uiux-socials span { width: 30px; height: 30px; font-size: 15px; }
}
@media print {
  .resume--uiux { padding: 28px; }
  .resume--uiux .r-sec { box-shadow: none; break-inside: avoid; }
}`;
