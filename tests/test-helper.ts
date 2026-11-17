import { db } from "../src/db";
import { sessions, users, items } from "../src/db/schema";

/**
 * Membersihkan database sebelum tiap skenario pengujian.
 * Menghapus data dengan urutan yang aman terhadap foreign key:
 * sessions -> users -> items.
 */
export async function clearDatabase() {
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(items);
}
