import json,sqlite3,sys
path=sys.argv[1]
req=json.load(sys.stdin)
with sqlite3.connect(path) as db:
 db.row_factory=sqlite3.Row
 if 'schema' in req: db.executescript(req['schema']);out=True
 else:
  results=[]
  for s in req['statements']:
   cur=db.execute(s['sql'],s['args'])
   results.append([dict(r) for r in cur.fetchall()])
  out=results
 print(json.dumps(out))
