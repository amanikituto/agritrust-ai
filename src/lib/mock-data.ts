// Realistic mocked data used across Farmer & Lender dashboards.

export type Climate = "Low" | "Med" | "High";
export type Gender = "F" | "M" | "NB";
export type Recommendation = "Approve" | "Conditional" | "Review" | "Decline";

export type Applicant = {
  id: string;
  name: string;
  county: string;
  crop: string;
  gender: Gender;
  age: number;
  disability: boolean;
  farmSizeAcres: number;
  score: number;
  climate: Climate;
  amount: number;
  rec: Recommendation;
  conf: number;
  status: "Pending" | "Approved" | "In review" | "Conditional" | "Declined";
  cooperative: string;
  phone: string;
  mobileMoney90d: number;
  loansRepaid: number;
  loansActive: number;
  savingsKES: number;
};

export const APPLICANTS: Applicant[] = [
  { id: "a1", name: "Amina Wanjiku", county: "Kiambu", crop: "Coffee", gender: "F", age: 34, disability: false, farmSizeAcres: 2.4, score: 742, climate: "Low", amount: 120000, rec: "Approve", conf: 0.94, status: "Pending", cooperative: "Kiambu Coffee Coop", phone: "+254 712 000 011", mobileMoney90d: 184500, loansRepaid: 3, loansActive: 0, savingsKES: 42800 },
  { id: "a2", name: "Joseph Mwangi", county: "Nyeri", crop: "Tea", gender: "M", age: 42, disability: false, farmSizeAcres: 5.1, score: 681, climate: "Med", amount: 250000, rec: "Review", conf: 0.71, status: "In review", cooperative: "Nyeri Tea Growers", phone: "+254 722 000 022", mobileMoney90d: 96200, loansRepaid: 2, loansActive: 1, savingsKES: 18900 },
  { id: "a3", name: "Grace Otieno", county: "Kisumu", crop: "Rice", gender: "F", age: 29, disability: true, farmSizeAcres: 1.8, score: 798, climate: "Low", amount: 90000, rec: "Approve", conf: 0.97, status: "Pending", cooperative: "Mwea Rice SACCO", phone: "+254 733 000 033", mobileMoney90d: 211400, loansRepaid: 4, loansActive: 0, savingsKES: 71500 },
  { id: "a4", name: "Peter Kiprono", county: "Nakuru", crop: "Maize", gender: "M", age: 51, disability: false, farmSizeAcres: 12.0, score: 540, climate: "High", amount: 300000, rec: "Decline", conf: 0.82, status: "Pending", cooperative: "Rift Valley Grain", phone: "+254 720 000 044", mobileMoney90d: 41200, loansRepaid: 1, loansActive: 2, savingsKES: 5400 },
  { id: "a5", name: "Wanjiru Njeri", county: "Murang'a", crop: "Avocado", gender: "F", age: 38, disability: false, farmSizeAcres: 3.2, score: 712, climate: "Low", amount: 175000, rec: "Approve", conf: 0.89, status: "Pending", cooperative: "Murang'a Avocado Hub", phone: "+254 711 000 055", mobileMoney90d: 158300, loansRepaid: 2, loansActive: 0, savingsKES: 31200 },
  { id: "a6", name: "Samuel Tanui", county: "Trans Nzoia", crop: "Wheat", gender: "M", age: 47, disability: true, farmSizeAcres: 8.5, score: 624, climate: "Med", amount: 210000, rec: "Conditional", conf: 0.66, status: "Conditional", cooperative: "TN Wheat Coop", phone: "+254 715 000 066", mobileMoney90d: 72100, loansRepaid: 2, loansActive: 1, savingsKES: 14400 },
  { id: "a7", name: "Faith Achieng", county: "Kakamega", crop: "Sugarcane", gender: "F", age: 31, disability: false, farmSizeAcres: 4.0, score: 689, climate: "Med", amount: 140000, rec: "Approve", conf: 0.86, status: "Approved", cooperative: "Mumias Outgrowers", phone: "+254 706 000 077", mobileMoney90d: 122800, loansRepaid: 3, loansActive: 0, savingsKES: 26800 },
  { id: "a8", name: "Daniel Ouma", county: "Bungoma", crop: "Beans", gender: "M", age: 26, disability: false, farmSizeAcres: 1.5, score: 612, climate: "Low", amount: 60000, rec: "Approve", conf: 0.78, status: "Pending", cooperative: "Bungoma Pulses", phone: "+254 728 000 088", mobileMoney90d: 58400, loansRepaid: 1, loansActive: 0, savingsKES: 9200 },
  { id: "a9", name: "Esther Mutua", county: "Machakos", crop: "Mango", gender: "F", age: 44, disability: true, farmSizeAcres: 2.8, score: 705, climate: "Med", amount: 110000, rec: "Approve", conf: 0.88, status: "Pending", cooperative: "Machakos Fruit Coop", phone: "+254 718 000 099", mobileMoney90d: 134200, loansRepaid: 2, loansActive: 0, savingsKES: 22600 },
  { id: "a10", name: "John Kamau", county: "Kiambu", crop: "Dairy", gender: "M", age: 36, disability: false, farmSizeAcres: 2.0, score: 758, climate: "Low", amount: 200000, rec: "Approve", conf: 0.92, status: "Pending", cooperative: "Githunguri Dairy", phone: "+254 700 000 100", mobileMoney90d: 246800, loansRepaid: 4, loansActive: 0, savingsKES: 58300 },
];

export const COUNTY_TRUST: { name: string; v: number; risk: Climate }[] = [
  { name: "Kiambu", v: 92, risk: "Low" },
  { name: "Nyeri", v: 78, risk: "Low" },
  { name: "Murang'a", v: 71, risk: "Low" },
  { name: "Nakuru", v: 64, risk: "Med" },
  { name: "Kisumu", v: 81, risk: "Low" },
  { name: "Trans Nzoia", v: 58, risk: "Med" },
  { name: "Meru", v: 74, risk: "Low" },
  { name: "Kakamega", v: 69, risk: "Med" },
  { name: "Machakos", v: 55, risk: "High" },
  { name: "Bungoma", v: 62, risk: "Med" },
  { name: "Uasin Gishu", v: 70, risk: "Low" },
  { name: "Embu", v: 66, risk: "Low" },
  { name: "Garissa", v: 38, risk: "High" },
  { name: "Turkana", v: 32, risk: "High" },
];

export const TRUST_HISTORY = [612, 624, 631, 640, 655, 662, 678, 689, 701, 712, 728, 742];
export const RAINFALL = [40, 65, 80, 55, 38, 28, 22, 30, 48, 70, 88, 75];
export const INCOME = [22, 24, 25, 28, 31, 30, 33, 36, 35, 38, 40, 42];
export const SAVINGS = [4, 6, 7, 9, 11, 12, 14, 17, 19, 22, 26, 29];
export const PRODUCTION = [120, 135, 130, 150, 160, 155, 170, 180, 178, 195, 210, 225];

export const NOTIFICATIONS = [
  { id: "n1", t: "Heavy rainfall expected Thursday in Kiambu", k: "Climate", time: "2h ago" },
  { id: "n2", t: "Your loan application is under review", k: "Loan", time: "5h ago" },
  { id: "n3", t: "Repayment due in 5 days — KES 4,200", k: "Reminder", time: "Yesterday" },
  { id: "n4", t: "New training: Climate-smart maize", k: "Training", time: "2d ago" },
  { id: "n5", t: "Cooperative ranking improved to #12", k: "Achievement", time: "3d ago" },
  { id: "n6", t: "Mobile money pattern verified", k: "Trust", time: "4d ago" },
];

export const LENDER_NOTIFICATIONS = [
  { id: "ln1", t: "3 new applications require manual review", k: "Queue", time: "1h ago" },
  { id: "ln2", t: "Climate alert: Drought intensifying in Machakos", k: "Climate", time: "3h ago" },
  { id: "ln3", t: "Bias check passed for Q4 batch", k: "Compliance", time: "Yesterday" },
  { id: "ln4", t: "Portfolio default rate dropped to 3.1%", k: "Performance", time: "2d ago" },
  { id: "ln5", t: "New policy draft from Risk Committee", k: "Policy", time: "3d ago" },
];

export const SHAP_FACTORS = {
  positive: [
    { l: "24 mo. consistent M-Pesa savings", v: 0.22 },
    { l: "Cooperative tenure 5 yrs · high centrality", v: 0.18 },
    { l: "Climate score Low — Kiambu rainfall stable", v: 0.11 },
    { l: "Verified production records", v: 0.09 },
    { l: "Repayment history clean", v: 0.08 },
  ],
  negative: [
    { l: "Limited formal financial records", v: -0.06 },
    { l: "No crop insurance on file", v: -0.04 },
    { l: "Single-crop concentration", v: -0.03 },
  ],
};

export function findApplicant(id: string) {
  return APPLICANTS.find((a) => a.id === id);
}
