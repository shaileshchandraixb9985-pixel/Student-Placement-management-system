export const BRANCHES = ["CSE", "CYS", "IT", "ECE", "ME"];
export const STATUSES = ["Applied", "Shortlisted", "Selected", "Rejected"];
export const uid = () => Math.random().toString(36).slice(2, 9);

// Unit 2: inheritance Person -> Student / Recruiter
export class Person {
  constructor({ id, name, email }) {
    if (!name || !name.trim()) throw new Error("Name is required.");
    if (!/^\S+@\S+\.\S+$/.test(email || "")) throw new Error("Enter a valid email address.");
    this.id = id;
    this.name = name.trim();
    this.email = email.trim();
  }
}

export class Student extends Person {
  constructor(o) {
    super(o);
    this.branch = o.branch;
    this.cgpa = Math.round(Number(o.cgpa) * 100) / 100;
    this.backlogs = Number(o.backlogs) || 0;
    if (!(this.cgpa >= 0 && this.cgpa <= 10)) throw new Error("CGPA must be between 0 and 10.");
    if (this.backlogs < 0) throw new Error("Backlogs cannot be negative.");
  }
}

export class Recruiter extends Person {}

// Unit 3: custom exception
export class NotEligibleException extends Error {
  constructor(reasons) {
    super(reasons.join(" "));
    this.name = "NotEligibleException";
    this.reasons = reasons;
  }
}

// Unit 2: Eligible contract. Returns true or throws NotEligibleException.
export function checkEligibility(student, drive) {
  const reasons = [];
  if (student.cgpa < drive.minCgpa)
    reasons.push(`CGPA ${student.cgpa} is below the required ${drive.minCgpa}.`);
  if (student.backlogs > drive.maxBacklogs)
    reasons.push(`${student.backlogs} backlog(s) exceed the limit of ${drive.maxBacklogs}.`);
  if (!drive.branches.includes(student.branch))
    reasons.push(`${student.branch} is not an eligible branch for this drive.`);
  if (reasons.length) throw new NotEligibleException(reasons);
  return true;
}
