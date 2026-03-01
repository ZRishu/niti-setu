import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const allStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi NCR", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const phoneRegex = /^\d{10}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const nameRegex = /^[a-zA-Z\s]+$/;

const capitalizeWords = (str) => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

const validateProfile = (profile = {}) => {
  if (!profile.state || !allStates.includes(profile.state)) {
    throw new Error("Please select a valid Indian state or UT from the list");
  }

  if (!profile.age || Number(profile.age) < 18) {
    throw new Error("Age must be at least 18 years");
  }

  if (profile.district && !nameRegex.test(profile.district)) {
    throw new Error("District name can only contain letters and spaces");
  }

  if (profile.cropType && !nameRegex.test(profile.cropType)) {
    throw new Error("Crop name can only contain letters and spaces");
  }

  if (profile.socialCategory && !["General", "OBC", "SC", "ST"].includes(profile.socialCategory)) {
    throw new Error("Please select a valid social category");
  }

  if (profile.gender && !["Male", "Female", "Other"].includes(profile.gender)) {
    throw new Error("Please select a valid gender");
  }

  return {
    state: profile.state,
    district: profile.district ? capitalizeWords(profile.district.trim()) : undefined,
    landHolding: profile.landHolding !== undefined ? Number(profile.landHolding) : undefined,
    cropType: profile.cropType ? capitalizeWords(profile.cropType.trim()) : undefined,
    socialCategory: profile.socialCategory,
    gender: profile.gender,
    age: Number(profile.age)
  };
};

const users = () => getCollection("users");

export const normalizeUserInput = ({ name, email, phoneNumber }) => {
  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phoneNumber?.trim();

  if (!normalizedName || !nameRegex.test(normalizedName)) {
    throw new Error("Name can only contain letters and spaces");
  }

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    throw new Error("Please add a valid email with @ and . characters");
  }

  if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
    throw new Error("Phone number must be exactly 10 digits");
  }

  return {
    name: capitalizeWords(normalizedName),
    email: normalizedEmail,
    phoneNumber: normalizedPhone
  };
};

export const validatePassword = (password) => {
  if (!passwordRegex.test(password || "")) {
    throw new Error("Password must contain uppercase, lowercase, number, and special character");
  }
};

export const hashPassword = async (password) => Bun.password.hash(password, "bcrypt");
export const verifyPassword = async (password, hash) => Bun.password.verify(password, hash, "bcrypt");

export const createUser = async ({ name, email, phoneNumber, password, role = "user", profile }) => {
  const result = await users().insertOne({
    name,
    email,
    phoneNumber,
    password,
    role,
    profile: validateProfile(profile),
    createdAt: new Date()
  });

  return findUserById(result.insertedId.toString(), true);
};

export const findUserByEmail = async (email, includePassword = false) => {
  const user = await users().findOne({ email });
  if (!user) return null;
  if (!includePassword) delete user.password;
  return user;
};

export const findUserById = async (id, includePassword = false) => {
  if (!ObjectId.isValid(id)) return null;
  const user = await users().findOne({ _id: new ObjectId(id) });
  if (!user) return null;
  if (!includePassword) delete user.password;
  return user;
};

export const setUserRole = async (id, role) => {
  if (!ObjectId.isValid(id)) return null;
  await users().updateOne({ _id: new ObjectId(id) }, { $set: { role } });
  return findUserById(id);
};

export const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  profile: user.profile
});
