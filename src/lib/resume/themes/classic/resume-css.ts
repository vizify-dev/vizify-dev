// "Classic" resume theme. The CSS targets the class names produced by lib/resume.ts.
export const RESUME_CLASSIC_CSS = `.resume {
    max-width: 794px;
    margin: 0 auto;
    background: #fff;
    color: #1f2837;
    border: 1px solid #d9dde5;
    border-radius: 20px;
    overflow: hidden;
    font: 13px/1.55 "Montserrat", system-ui, sans-serif;
    box-shadow: 0 8px 30px rgba(31, 40, 55, 0.08);
  }
  
  .r-head {
    padding: 40px 56px 18px;
    text-align: center;
    border-bottom: 2px solid #8b9099;
  }
  .r-head h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .r-role {
    margin: 4px 0 0;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .r-contact {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 36px;
    margin: 22px 0 0;
    padding: 0;
    list-style: none;
    font-size: 12px;
  }
  .r-contact li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .r-contact svg {
    width: 14px;
    height: 14px;
    flex: none;
  }
  
  .r-body {
    padding: 4px 56px 44px;
  }
  .r-sec {
    margin-top: 28px;
  }
  .r-sec h2 {
    margin: 0 0 10px;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  
  .r-text {
    margin: 0;
    text-align: justify;
  }
  .r-entry {
    margin-bottom: 16px;
  }
  .r-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 32px;
  }
  .r-title {
    font-size: 12.5px;
    font-weight: 700;
  }
  .r-date {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .r-sub {
    margin-top: 1px;
  }
  .r-bullets,
  .r-list {
    margin: 4px 0 0;
    padding-left: 20px;
    list-style: disc;
  }
  .r-list {
    margin-top: 0;
  }
  .r-bullets li,
  .r-list li {
    margin: 2px 0;
    padding-left: 4px;
  }
  .r-skills {
    margin: 0;
    padding: 0;
    list-style: none;
    columns: 3;
    column-gap: 24px;
  }
  .r-skills li {
    margin: 2px 0;
    break-inside: avoid;
  }
  
  @media (max-width: 600px) {
    .r-head,
    .r-body {
      padding-left: 24px;
      padding-right: 24px;
    }
    .r-skills {
      columns: 2;
    }
  }
  @media print {
    .resume {
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
  }`;