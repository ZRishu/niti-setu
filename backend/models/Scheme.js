import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const schemes = () => getCollection("schemes");

export const deleteSchemesByName = async (name) => schemes().deleteMany({ name });
export const insertSchemes = async (items) => schemes().insertMany(items);

export const aggregateSchemes = async (pipeline) => schemes().aggregate(pipeline).toArray();

export const findSchemeById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  return schemes().findOne({ _id: new ObjectId(id) });
};

export const findSchemesByName = async (name) => schemes().find({ name }).toArray();

export const distinctSchemeNames = async () => schemes().distinct("name");
