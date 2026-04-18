import type { PrismaClient } from "@prisma/client";
import type { DbClient } from "./prisma";

/**
 * 複数の書き込み操作をまとめてトランザクション実行する。
 * 個別 service が $transaction を直接使うケースもあるが、
 * 複数 service をまたぐ場合にこのヘルパーを利用する。
 */
export async function runInTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: DbClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return fn(tx);
  });
}
