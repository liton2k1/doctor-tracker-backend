import { DoctorModel } from "../modules/doctor/doctor.model";
import { PatientModel } from "../modules/patient/patient.model";
import { Gender } from "../modules/user/user.interface";

const DAY_MS = 24 * 60 * 60 * 1000;

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];
const randomDateWithin = (days: number) =>
  new Date(Date.now() - Math.random() * days * DAY_MS);
const randomPhone = () =>
  `01${pick([3, 5, 7, 8, 9])}${Math.floor(10000000 + Math.random() * 89999999)}`;

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "Oncology",
  "Psychiatry",
];
const HOSPITALS = [
  "Square Hospital",
  "United Hospital",
  "Evercare Hospital",
  "Labaid Hospital",
  "Popular Medical",
];
const CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Migraine",
  "Asthma",
  "Fracture",
  "Eczema",
  "Anxiety",
  "Arthritis",
  "Flu",
];
const FIRST_NAMES = [
  "Rahim",
  "Karim",
  "Nusrat",
  "Sadia",
  "Tanvir",
  "Farhan",
  "Mim",
  "Arif",
  "Sumaiya",
  "Imran",
  "Nabila",
  "Jahid",
];
const LAST_NAMES = [
  "Hossain",
  "Ahmed",
  "Rahman",
  "Islam",
  "Chowdhury",
  "Khan",
  "Akter",
  "Sarker",
];

const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

export const seedSampleData = async () => {
  await Promise.all([DoctorModel.deleteMany({}), PatientModel.deleteMany({})]);

  const doctors = await DoctorModel.insertMany(
    Array.from({ length: 14 }, (_, index) => ({
      name: `Dr. ${fullName()}`,
      specialization: pick(SPECIALIZATIONS),
      hospital: pick(HOSPITALS),
      phone: randomPhone(),
      email: `doctor${index + 1}@doctortracker.dev`,
      patientCount: 0,
      createdAt: randomDateWithin(120),
    })),
  );

  const patients = await PatientModel.insertMany(
    Array.from({ length: 160 }, () => ({
      name: fullName(),
      age: 1 + Math.floor(Math.random() * 90),
      gender: pick(Object.values(Gender)),
      phone: randomPhone(),
      condition: pick(CONDITIONS),
      doctor: pick(doctors)._id,
      createdAt: randomDateWithin(90),
    })),
  );

  const counts = await PatientModel.aggregate<{ _id: unknown; count: number }>([
    { $group: { _id: "$doctor", count: { $sum: 1 } } },
  ]);
  await DoctorModel.bulkWrite(
    counts.map((item) => ({
      updateOne: {
        filter: { _id: item._id as never },
        update: { $set: { patientCount: item.count } },
      },
    })),
  );

  console.log(
    `Sample data created : ${doctors.length} doctors, ${patients.length} patients`,
  );
};
