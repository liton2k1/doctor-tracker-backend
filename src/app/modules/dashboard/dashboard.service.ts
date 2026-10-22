import httpStatus from "http-status-codes";
import AppError from "../../helpers/AppError";
import { DoctorModel } from "../doctor/doctor.model";
import { PatientModel } from "../patient/patient.model";
import {
  TDistributionItem,
  TLimitQuery,
  TTimelineInterval,
  TTimelinePoint,
  TTimelineQuery,
} from "./dashboard.interface";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 30;

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const bucketFormat = (interval: TTimelineInterval) =>
  interval === "day" ? "%Y-%m-%d" : "%Y-%m";

// Group createdAt into day/month buckets inside the range (served by the createdAt index)
const aggregateBuckets = async (
  model: typeof DoctorModel | typeof PatientModel,
  from: Date,
  to: Date,
  interval: TTimelineInterval,
) => {
  const rows = await (model as typeof DoctorModel).aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: bucketFormat(interval),
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
};

// Every bucket key in the range, so charts have no gaps
const listBucketKeys = (from: Date, to: Date, interval: TTimelineInterval) => {
  const keys: string[] = [];

  if (interval === "day") {
    for (
      let time = startOfUtcDay(from).getTime();
      time <= to.getTime();
      time += DAY_MS
    ) {
      keys.push(new Date(time).toISOString().slice(0, 10));
    }
  } else {
    const cursor = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
    );
    while (cursor.getTime() <= to.getTime()) {
      keys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  return keys;
};

const groupCount = async (
  model: typeof DoctorModel | typeof PatientModel,
  field: string,
  limit: number,
): Promise<TDistributionItem[]> => {
  const rows = await (model as typeof DoctorModel).aggregate<{
    _id: string;
    count: number;
  }>([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((row) => ({ label: row._id, count: row.count }));
};

// Overview cards
const getOverview = async () => {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * DAY_MS);
  const todayStart = startOfUtcDay(now);

  const [totalDoctors, totalPatients, newDoctors, newPatients, patientsToday] =
    await Promise.all([
      DoctorModel.estimatedDocumentCount(),
      PatientModel.estimatedDocumentCount(),
      DoctorModel.countDocuments({ createdAt: { $gte: last30Days } }),
      PatientModel.countDocuments({ createdAt: { $gte: last30Days } }),
      PatientModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

  return {
    totalDoctors,
    totalPatients,
    averagePatientsPerDoctor:
      totalDoctors === 0
        ? 0
        : Number((totalPatients / totalDoctors).toFixed(2)),
    newDoctorsLast30Days: newDoctors,
    newPatientsLast30Days: newPatients,
    patientsToday,
  };
};

// Reads the denormalized counter through the { patientCount: -1 } index
const getPatientsPerDoctor = async ({ limit }: TLimitQuery) => {
  const doctors = await DoctorModel.find({ patientCount: { $gt: 0 } })
    .sort({ patientCount: -1, _id: -1 })
    .limit(limit)
    .select("name specialization patientCount profile")
    .lean();

  return doctors.map((doctor) => ({
    doctorId: doctor._id.toString(),
    name: doctor.name,
    specialization: doctor.specialization,
    profile: doctor.profile,
    patientCount: doctor.patientCount ?? 0,
  }));
};

// Doctors + patients created per day/month (zero-filled)
const getTimeline = async (query: TTimelineQuery) => {
  const to = query.to ?? new Date();
  const from =
    query.from ?? new Date(to.getTime() - (DEFAULT_RANGE_DAYS - 1) * DAY_MS);
  const { interval } = query;

  if (
    interval === "day" &&
    (to.getTime() - from.getTime()) / DAY_MS > MAX_DAILY_RANGE_DAYS
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Daily timeline is limited to ${MAX_DAILY_RANGE_DAYS} days. Use interval=month for longer ranges !`,
    );
  }

  const rangeStart = interval === "day" ? startOfUtcDay(from) : from;
  const rangeEnd = new Date(startOfUtcDay(to).getTime() + DAY_MS - 1);

  const [doctorBuckets, patientBuckets] = await Promise.all([
    aggregateBuckets(DoctorModel, rangeStart, rangeEnd, interval),
    aggregateBuckets(PatientModel, rangeStart, rangeEnd, interval),
  ]);

  const series: TTimelinePoint[] = listBucketKeys(
    rangeStart,
    rangeEnd,
    interval,
  ).map((date) => ({
    date,
    doctors: doctorBuckets.get(date) ?? 0,
    patients: patientBuckets.get(date) ?? 0,
  }));

  return { from: rangeStart, to: rangeEnd, interval, series };
};

// Condition / gender / specialization breakdowns
const getDistributions = async ({ limit }: TLimitQuery) => {
  const [patientsByCondition, patientsByGender, doctorsBySpecialization] =
    await Promise.all([
      groupCount(PatientModel, "condition", limit),
      groupCount(PatientModel, "gender", 3),
      groupCount(DoctorModel, "specialization", limit),
    ]);

  return { patientsByCondition, patientsByGender, doctorsBySpecialization };
};

export const DashboardServices = {
  getOverview,
  getPatientsPerDoctor,
  getTimeline,
  getDistributions,
};
