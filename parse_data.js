const data = `
 1 	 Finland 	 Bootcamp 	 Bootcamp1 	 23-Apr-26 	 25-Apr-26 
 2 	 Finland 	 Mentorship 	 Group mentoring (virtual) 	 02-May-26 	 09-May-26 
 3 	 Finland 	 Selection Day 	 Selection day (virtual) 	 16-May-26 	 
 4 	 Finland 	 Bootcamp 	 Bootcamp2 	 29-May-26 	 01-Jun-26 
 5 	 Finland 	 Mentorship 	 1:1 mentoring 	 23-May-26 	 30-Jul-26 
 6 	 Finland 	 Demo Day 	 Demo day (+Pitch rehersal) 	 30-Jul-26 	 31-Jul-26 
 7 	 ClimateKIC 	 Bootcamp 	 Bootcamp1 	 11-Jun-26 	 13-Jun-26 
 8 	 ClimateKIC 	 Bootcamp 	 Bootcamp2 	 30-Jul-26 	 01-Aug-26 
 9 	 ClimateKIC 	 Bootcamp 	 Bootcamp3 	 01-Oct-26 	 03-Oct-26 
 10 	 ClimateKIC 	 Demo Day 	 Demo day 	 	 21-Nov-26 
 11 	 ClimateKIC 	 Bootcamp 	 C1- Bootcamp 2 	 23-Jul-26 	 25-Jul-26 
 12 	 ClimateKIC 	 Demo Day 	 C1- Demo Day 	 03-Sep-26 	 04-Sep-26 
 13 	 ClimateKIC 	 Hackathon 	 Hackathon 2 	 03-Sep-26 	 05-Sep-26 
 14 	 ClimateKIC 	 Bootcamp 	 C2- Bootcamp 1 	 13-Aug-26 	 15-Aug-26 
 15 	 ClimateKIC 	 Bootcamp 	 C2- Bootcamp 2 	 17-Sep-26 	 19-Sep-26 
 16 	 ClimateKIC 	 Bootcamp 	 C2- Bootcamp 3 	 02-Oct-26 	 04-Oct-26 
 17 	 ClimateKIC 	 Demo Day 	 C2- Demo Day 	 04-Dec-26 	 04-Dec-26 
 18 	 Finland 	 Hackathon 	 Hackathon 	 30-Jul-26 	 01-Aug-26 
 19 	 RFG 	 TOT for Business Mentors (2 rounds) 	 TOT for Business Mentors (2 rounds) 	 13-Jul-26 	 30-Jul-26 
 20 	 RFG 	 TOT for Business Mentors - Round 1 	 TOT for Business Mentors - Round 1 	 15-Jul-26 	 20-Jul-26 
 21 	 RFG 	 TOT for Business Mentors - Round 2 	 TOT for Business Mentors - Round 2 	 21-Jul-26 	 27-Jul-26 
 22 	 RFG 	 TOT for Household Coaches (1 round, 3 days) on project scope, data collection, and benificrairy selection proccess 	 TOT for Household Coaches (1 round, 3 days) on project scope, data collection, and benificrairy selection proccess 	 22-Jun-26 	 25-Jun-26 
 23 	 RFG 	 The training for the HC - Phase 1 	 The training for the HC - Phase 1 	 23-Jun-26 	 25-Jun-26 
 24 	 RFG 	 TOT for Household Coaches (1 round, 5 days) on coaching 	 TOT for Household Coaches (1 round, 5 days) on coaching 	 20-Sep-26 	 24-Sep-26 
 25 	 RFG 	 Cohort 1 (C1) – grouped below 	 Cohort 1 (C1) – grouped below 	 08-Jun-26 	 19-Mar-27 
 26 	 RFG 	 C1 – CB: Bootcamps 	 C1 – CB: Bootcamps 	 02-Aug-26 	 12-Aug-26 
 27 	 RFG 	 C1 - The Bootcamp 	 C1 - The Bootcamp 	 02-Aug-26 	 06-Aug-26 
 28 	 RFG 	 C1 – CB: 3 days + 1 pitching day 	 C1 – CB: 3 days + 1 pitching day 	 13-Aug-26 	 17-Sep-26 
 29 	 RFG 	 C1 -3 Days training -  Day1 	 C1 -3 Days training -  Day1 	 19-Aug-26 	 19-Aug-26 
 30 	 RFG 	 C1 - 3 Days training - Day2 	 C1 - 3 Days training - Day2 	 26-Aug-26 	 26-Aug-26 
 31 	 RFG 	 C1 - 3 Days training - Day3 	 C1 - 3 Days training - Day3 	 02-Sep-26 	 02-Sep-26 
 32 	 RFG 	 C1 - Coaching and prepare Ben. to pitching 	 C1 - Coaching and prepare Ben. to pitching 	 03-Sep-26 	 08-Sep-26 
 33 	 RFG 	 C1 - Pitching day 	 C1 - Pitching day 	 10-Sep-26 	 17-Sep-26 
 34 	 RFG 	 C1 – Mentoring & Coaching 	 C1 – Mentoring & Coaching 	 02-Oct-26 	 19-Mar-27 
 35 	 RFG 	 C1 – Mentoring & Coaching for loans 	 C1 – Mentoring & Coaching for loans 	 19-Mar-27 	 02-Oct-27 
 36 	 RFG 	 C1 – Market Linkages & Ecosystem 	 C1 – Market Linkages & Ecosystem 	 16-Oct-26 	 08-Jan-27 
 37 	 RFG 	 C1 – Sector-specific technical skills 	 C1 – Sector-specific technical skills 	 17-Sep-26 	 01-Oct-26 
 38 	 RFG 	 Cohort 2 (C2) – grouped below 	 Cohort 2 (C2) – grouped below 	 14-Oct-26 	 15-Jul-27 
 39 	 RFG 	 C2 – CB: Bootcamps 	 C2 – CB: Bootcamps 	 18-Nov-26 	 09-Dec-26 
 40 	 RFG 	 C2 - The Bootcamp 	 C2 - The Bootcamp 	 22-Nov-26 	 07-Dec-26 
 41 	 RFG 	 C2 – CB: 3 days + 1 pitching day 	 C2 – CB: 3 days + 1 pitching day 	 08-Dec-26 	 30-Dec-26 
 42 	 RFG 	 C2 -3 Days training -  Day1 	 C2 -3 Days training -  Day1 	 10-Dec-26 	 10-Dec-26 
 43 	 RFG 	 C2 - 3 Days training - Day2 	 C2 - 3 Days training - Day2 	 16-Dec-26 	 16-Dec-26 
 44 	 RFG 	 C2 - 3 Days training - Day3 	 C2 - 3 Days training - Day3 	 22-Dec-26 	 22-Dec-26 
 45 	 RFG 	 C2 - Coaching and prepare Ben. to pitching 	 C2 - Coaching and prepare Ben. to pitching 	 22-Dec-26 	 23-Dec-26 
 46 	 RFG 	 C2 - Pitching day 	 C2 - Pitching day 	 24-Dec-26 	 29-Dec-26 
 47 	 RFG 	 C2 – Sector-specific technical skills (as needed) 	 C2 – Sector-specific technical skills (as needed) 	 09-Feb-27 	 22-Feb-27 
 48 	 RFG 	 C2 – Mentoring & Coaching 	 C2 – Mentoring & Coaching 	 01-Feb-27 	 15-Jul-27 
 49 	 RFG 	 C2 – Market Linkages & Ecosystem 	 C2 – Market Linkages & Ecosystem 	 06-Feb-27 	 01-Jun-27 
 50 	 DAAP / Plan International 	 Incubator 	 Cohort 1 	 10-Apr-26 	 08-May-26 
 51 	 DAAP / Plan International 	 Training Day 	   Cohort 1 - Day 1 	 10-Apr-26 	 10-Apr-26 
 52 	 DAAP / Plan International 	 Training Day 	   Cohort 1 - Day 2 	 17-Apr-26 	 17-Apr-26 
 53 	 DAAP / Plan International 	 Training Day 	   Cohort 1 - Day 3 	 24-Apr-26 	 24-Apr-26 
 54 	 DAAP / Plan International 	 Training Day 	   Cohort 1 - Day 4 	 01-May-26 	 01-May-26 
 55 	 DAAP / Plan International 	 Training Day 	   Cohort 1 - Day 5 	 08-May-26 	 08-May-26 
 56 	 DAAP / Plan International 	 Incubator 	 Cohort 2 	 11-Apr-26 	 09-May-26 
 57 	 DAAP / Plan International 	 Training Day 	   Cohort 2 - Day 1 	 11-Apr-26 	 11-Apr-26 
 58 	 DAAP / Plan International 	 Training Day 	   Cohort 2 - Day 2 	 18-Apr-26 	 18-Apr-26 
 59 	 DAAP / Plan International 	 Training Day 	   Cohort 2 - Day 3 	 25-Apr-26 	 25-Apr-26 
 60 	 DAAP / Plan International 	 Training Day 	   Cohort 2 - Day 4 	 02-May-26 	 02-May-26 
 61 	 DAAP / Plan International 	 Training Day 	   Cohort 2 - Day 5 	 09-May-26 	 09-May-26 
 62 	 DAAP / Plan International 	 Incubator 	 Cohort 3 	 06-Jun-26 	 04-Jul-26 
 63 	 DAAP / Plan International 	 Training Day 	   Cohort 3 - Day 1 	 06-Jun-26 	 06-Jun-26 
 64 	 DAAP / Plan International 	 Training Day 	   Cohort 3 - Day 2 	 13-Jun-26 	 13-Jun-26 
 65 	 DAAP / Plan International 	 Training Day 	   Cohort 3 - Day 3 	 20-Jun-26 	 20-Jun-26 
 66 	 DAAP / Plan International 	 Training Day 	   Cohort 3 - Day 4 	 27-Jun-26 	 27-Jun-26 
 67 	 DAAP / Plan International 	 Training Day 	   Cohort 3 - Day 5 	 04-Jul-26 	 04-Jul-26 
 68 	 DAAP / Plan International 	 Incubator 	 Cohort 4 	 13-Jul-26 	 10-Aug-26 
 69 	 DAAP / Plan International 	 Training Day 	   Cohort 4 - Day 1 	 13-Jul-26 	 13-Jul-26 
 70 	 DAAP / Plan International 	 Training Day 	   Cohort 4 - Day 2 	 20-Jul-26 	 20-Jul-26 
 71 	 DAAP / Plan International 	 Training Day 	   Cohort 4 - Day 3 	 27-Jul-26 	 27-Jul-26 
 72 	 DAAP / Plan International 	 Training Day 	   Cohort 4 - Day 4 	 03-Aug-26 	 03-Aug-26 
 73 	 DAAP / Plan International 	 Training Day 	   Cohort 4 - Day 5 	 10-Aug-26 	 10-Aug-26 
 74 	 DAAP / Plan International 	 Incubator 	 Cohort 5 	 18-Jul-26 	 09-Aug-26 
 75 	 DAAP / Plan International 	 Training Day 	   Cohort 5 - Day 1 	 18-Jul-26 	 18-Jul-26 
 76 	 DAAP / Plan International 	 Training Day 	   Cohort 5 - Day 2 	 19-Jul-26 	 19-Jul-26 
 77 	 DAAP / Plan International 	 Training Day 	   Cohort 5 - Day 3 	 26-Jul-26 	 26-Jul-26 
 78 	 DAAP / Plan International 	 Training Day 	   Cohort 5 - Day 4 	 02-Aug-26 	 02-Aug-26 
 79 	 DAAP / Plan International 	 Training Day 	   Cohort 5 - Day 5 	 09-Aug-26 	 09-Aug-26 
 80 	 DAAP / Plan International 	 Incubator 	 Cohort 6 	 11-Jul-26 	 08-Aug-26 
 81 	 DAAP / Plan International 	 Training Day 	   Cohort 6 - Day 1 	 11-Jul-26 	 11-Jul-26 
 82 	 DAAP / Plan International 	 Training Day 	   Cohort 6 - Day 2 	 18-Jul-26 	 18-Jul-26 
 83 	 DAAP / Plan International 	 Training Day 	   Cohort 6 - Day 3 	 25-Jul-26 	 25-Jul-26 
 84 	 DAAP / Plan International 	 Training Day 	   Cohort 6 - Day 4 	 01-Aug-26 	 01-Aug-26 
 85 	 DAAP / Plan International 	 Training Day 	   Cohort 6 - Day 5 	 08-Aug-26 	 08-Aug-26 
 86 	 DAAP / Plan International 	 Incubator 	 Cohort 7 	 16-Aug-26 	 13-Sep-26 
 87 	 DAAP / Plan International 	 Training Day 	   Cohort 7 - Day 1 	 16-Aug-26 	 16-Aug-26 
 88 	 DAAP / Plan International 	 Training Day 	   Cohort 7 - Day 2 	 23-Aug-26 	 23-Aug-26 
 89 	 DAAP / Plan International 	 Training Day 	   Cohort 7 - Day 3 	 30-Aug-26 	 30-Aug-26 
 90 	 DAAP / Plan International 	 Training Day 	   Cohort 7 - Day 4 	 06-Sep-26 	 06-Sep-26 
 91 	 DAAP / Plan International 	 Training Day 	   Cohort 7 - Day 5 	 13-Sep-26 	 13-Sep-26 
 92 	 DAAP / Plan International 	 Incubator 	 Cohort 8 	 15-Aug-26 	 12-Sep-26 
 93 	 DAAP / Plan International 	 Training Day 	   Cohort 8 - Day 1 	 15-Aug-26 	 15-Aug-26 
 94 	 DAAP / Plan International 	 Training Day 	   Cohort 8 - Day 2 	 22-Aug-26 	 22-Aug-26 
 95 	 DAAP / Plan International 	 Training Day 	   Cohort 8 - Day 3 	 29-Aug-26 	 29-Aug-26 
 96 	 DAAP / Plan International 	 Training Day 	   Cohort 8 - Day 4 	 05-Sep-26 	 05-Sep-26 
 97 	 DAAP / Plan International 	 Training Day 	   Cohort 8 - Day 5 	 12-Sep-26 	 12-Sep-26 
 98 	 DAAP / Plan International 	 Incubator 	 Cohort 9 	 18-Sep-26 	 10-Oct-26 
 99 	 DAAP / Plan International 	 Training Day 	   Cohort 9 - Day 1 	 18-Sep-26 	 18-Sep-26 
 100 	 DAAP / Plan International 	 Training Day 	   Cohort 9 - Day 2 	 19-Sep-26 	 19-Sep-26 
 101 	 DAAP / Plan International 	 Training Day 	   Cohort 9 - Day 3 	 20-Sep-26 	 20-Sep-26 
 102 	 DAAP / Plan International 	 Training Day 	   Cohort 9 - Day 4 	 03-Oct-26 	 03-Oct-26 
 103 	 DAAP / Plan International 	 Training Day 	   Cohort 9 - Day 5 	 10-Oct-26 	 10-Oct-26 
 104 	 DAAP / Plan International 	 Incubator 	 Cohort 10 	 26-Sep-26 	 24-Oct-26 
 105 	 DAAP / Plan International 	 Training Day 	   Cohort 10 - Day 1 	 26-Sep-26 	 26-Sep-26 
 106 	 DAAP / Plan International 	 Training Day 	   Cohort 10 - Day 2 	 27-Sep-26 	 27-Sep-26 
 107 	 DAAP / Plan International 	 Training Day 	   Cohort 10 - Day 3 	 28-Sep-26 	 28-Sep-26 
 108 	 DAAP / Plan International 	 Training Day 	   Cohort 10 - Day 4 	 17-Oct-26 	 17-Oct-26 
 109 	 DAAP / Plan International 	 Training Day 	   Cohort 10 - Day 5 	 24-Oct-26 	 24-Oct-26
`;

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return "NULL";
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return "NULL";
  const day = parts[0];
  const monthStr = parts[1];
  const year = "20" + parts[2];
  const months = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const month = months[monthStr];
  return `'${year}-${month}-${day.padStart(2, "0")}'`;
}

const lines = data.trim().split("\n");
const values = lines.map((line) => {
  const parts = line.split("\t").map((p) => p.trim());
  if (parts.length < 6) return null;
  const project = parts[1];
  const category = parts[2];
  const activity = parts[3];
  const startDate = parseDate(parts[4]);
  const endDate = parseDate(parts[5]);
  return `('${project.replace(/'/g, "''")}', '${category.replace(/'/g, "''")}', '${activity.replace(/'/g, "''")}', ${startDate}, ${endDate})`;
}).filter((v) => v !== null);

process.stdout.write("INSERT INTO public.project_schedules (project, category, activity, start_date, end_date) VALUES\n");
process.stdout.write(values.join(",\n") + ";\n");
