// Mantém a validação TLS do certificado e do hostname com a CA do provedor.
function connectionOptions(databaseUrl) {
  if (!databaseUrl) return {
    user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT || 5432),
  };
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');
  if (!ca) return { connectionString: databaseUrl };
  const url = new URL(databaseUrl);
  for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } };
}
module.exports = { connectionOptions };
