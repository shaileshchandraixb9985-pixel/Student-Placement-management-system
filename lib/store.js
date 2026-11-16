"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "placement-db-v1";
const seed = {
  students: [
    { id: "s1", name: "Priya Chaudhary", email: "priya@example.com", branch: "CSE", cgpa: 8.6, backlogs: 0 },
    { id: "s2", name: "Kajal Kumari", email: "kajal@example.com", branch: "CSE", cgpa: 7.4, backlogs: 1 },
    { id: "s3", name: "Palkpreet Kaur", email: "palkpreet@example.com", branch: "IT", cgpa: 9.1, backlogs: 0 },
    { id: "s4", name: "Shailesh Chandra", email: "shailesh@example.com", branch: "CYS", cgpa: 6.8, backlogs: 2 },
  ],
  companies: [
    { id: "c1", name: "Infosys", sector: "IT Services", recruiter: "Anita Rao", recruiterEmail: "anita@infosys.example" },
    { id: "c2", name: "Zoho", sector: "Software Products", recruiter: "Karthik M", recruiterEmail: "karthik@zoho.example" },
    { id: "c3", name: "Palo Alto Networks", sector: "Cybersecurity", recruiter: "Dev Malhotra", recruiterEmail: "dev@pan.example" },
  ],
  drives: [
    { id: "d1", companyId: "c1", role: "Systems Engineer", ctc: 4.5, minCgpa: 6.0, maxBacklogs: 2, branches: ["CSE", "IT", "CYS", "ECE"], date: "2026-12-05" },
    { id: "d2", companyId: "c2", role: "Member Technical Staff", ctc: 9, minCgpa: 8.0, maxBacklogs: 0, branches: ["CSE", "IT"], date: "2026-12-12" },
    { id: "d3", companyId: "c3", role: "Security Analyst", ctc: 12, minCgpa: 7.5, maxBacklogs: 0, branches: ["CYS", "CSE"], date: "2026-12-20" },
  ],
  applications: [
    { id: "a1", studentId: "s1", driveId: "d2", status: "Selected" },
    { id: "a2", studentId: "s2", driveId: "d1", status: "Applied" },
  ],
};

export function useDB() {
  const [db, setDb] = useState(null);
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      setDb(s ? JSON.parse(s) : seed);
    } catch {
      setDb(seed);
    }
  }, []);
  const update = useCallback((fn) => {
    setDb((prev) => {
      const next = fn(structuredClone(prev));
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const reset = useCallback(() => update(() => structuredClone(seed)), [update]);
  return [db, update, reset];
}
