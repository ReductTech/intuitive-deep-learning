/** Annual cohorts, not cumulative totals. Scene volumes are illustrative. */
export const iclrSubmissions = [
  { year: 2013, count: 67 },
  { year: 2014, count: 87 },
  { year: 2015, count: 143 },
  { year: 2016, count: 265, lowerBound: true },
  { year: 2017, count: 490 },
  { year: 2018, count: 1018 },
  { year: 2019, count: 1579 },
  { year: 2020, count: 2594 },
  { year: 2021, count: 3014 },
  { year: 2022, count: 3391 },
  { year: 2023, count: 4938 },
  { year: 2024, count: 7262 },
  { year: 2025, count: 11603 },
  { year: 2026, count: 19525 },
  { year: 2027, count: 43013 },
] as const;

// Early years: official opening report; 2016 is reported as >265.
// https://iclr.cc/archive/www/lib/exe/fetch.php%3Fmedia=iclr2016:opening.pdf
// 2017–2020: original OpenReview census, including withdrawn/desk-rejected
// records (2026-09-21 snapshot). Historical inclusion rules differ.
// https://reviewer3.com/evidence/iclr-submissions-2027
// 2021/2022/2023: official fact sheets, respectively 3,014 / 3,391 / 4,938.
// https://iclr.cc/media/Press/ICLR_2021_Fact_Sheet.pdf
// https://iclr.cc/media/Press/ICLR_2022_Fact_Sheet.pdf
// https://media.iclr.cc/Conferences/ICLR2023/ICLR2023-Fact_Sheet.pdf
// 2024: official sheet reports 7,262.
// https://media.iclr.cc/Conferences/ICLR2024/ICLR2024-Fact_Sheet.pdf
// 2025/2026: official fact sheet and program chairs' retrospective.
// https://media.iclr.cc/Conferences/ICLR2026/ICLR2026_Fact_Sheet.pdf
// https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/
// 2027: public submission-pool snapshot taken 2026-10-08 (not abstract IDs
// and not the eventual final valid-submission tally).
// https://suchenl.github.io/iclr2027/

export function formatSubmissionCount(item: (typeof iclrSubmissions)[number]) {
  return item.count.toLocaleString('en-US') + ('lowerBound' in item ? '+' : '');
}
