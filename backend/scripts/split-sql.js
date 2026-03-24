/**
 * Spezza SQL in statement rispettando solo dollar-quote PostgreSQL ($$ … $$ o $tag$ … $tag$).
 * Non confonde con bcrypt ($2b$12$…): il tag deve iniziare con lettera o _.
 */
function readDollarQuoted(sql, i) {
  if (sql[i] !== '$') return null;

  if (sql[i + 1] === '$') {
    const close = sql.indexOf('$$', i + 2);
    if (close === -1) throw new Error('Stringa $$ non chiusa nello SQL');
    return { end: close + 2, text: sql.slice(i, close + 2) };
  }

  const m = sql.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*)\$/);
  if (!m) return null;
  const tag = m[0];
  const close = sql.indexOf(tag, i + tag.length);
  if (close === -1) throw new Error(`Stringa dollar-quote ${tag} non chiusa nello SQL`);
  return { end: close + tag.length, text: sql.slice(i, close + tag.length) };
}

function splitSqlStatements(sql) {
  const out = [];
  let buf = '';
  let i = 0;

  const skipLineComment = () => {
    while (i < sql.length && sql[i] !== '\n') i++;
  };

  while (i < sql.length) {
    const c = sql[i];
    if (c === '-' && sql[i + 1] === '-') {
      skipLineComment();
      continue;
    }
    if (c === '$') {
      const dq = readDollarQuoted(sql, i);
      if (dq) {
        buf += dq.text;
        i = dq.end;
        continue;
      }
    }
    if (c === ';') {
      let j = i + 1;
      while (j < sql.length && /[\s\r]/.test(sql[j])) j++;
      const t = buf.trim();
      if (t) out.push(t);
      buf = '';
      i = j;
      continue;
    }
    buf += c;
    i++;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

module.exports = { splitSqlStatements };
