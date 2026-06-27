import neo4j, { type Driver } from "neo4j-driver";

let _driver: Driver | null = null;

export function getDriver(): Driver {
  if (_driver) return _driver;
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME;
  const pass = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !pass) {
    throw new Error("Neo4j credentials are not configured");
  }
  _driver = neo4j.driver(uri, neo4j.auth.basic(user, pass), {
    disableLosslessIntegers: true,
  });
  return _driver;
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const driver = getDriver();
  const database = process.env.NEO4J_DATABASE || undefined;
  const session = driver.session(database ? { database } : undefined);
  try {
    const res = await session.run(cypher, params);
    return res.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}
