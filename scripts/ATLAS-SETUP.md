# Step 1 — MongoDB Atlas for **Pizzerio Bites** (separate from NeonBite)

## Important: two independent projects

| Project | Database | What you do |
|---------|----------|-------------|
| **NeonBite Café** | `neonbite-cafe` on old cluster | **Do nothing** — keep running as-is |
| **Pizzerio Bites** | `pizzerio-bites` on **new** cluster | Create cluster + import or seed |

Nothing in this guide writes to or changes `neonbite-cafe`. NeonBite keeps its own repo, `.env`, and Atlas cluster.

---

## 1A. Create the new cluster (Atlas web UI)

1. [MongoDB Atlas](https://cloud.mongodb.com) → **Deploy** → **Create** → **M0 Free**
2. **Cluster name:** `pizzerio-bites-cluster` (new cluster — not NeonBite’s `cluster0`)
3. **Database Access** → create a user (read/write any database)
4. **Network Access** → your IP + `0.0.0.0/0` for Render later
5. **Connect** → **Drivers** → URI with database `pizzerio-bites`:

```text
mongodb+srv://USER:PASS@pizzerio-bites-cluster.xxxxx.mongodb.net/pizzerio-bites?retryWrites=true&w=majority
```

Add to `.env` for the **pizzerio-bites** project only:

```env
NEW_MONGODB_URI=mongodb+srv://USER:PASS@....mongodb.net/pizzerio-bites?retryWrites=true&w=majority
```

Do **not** put the NeonBite URI here. Do **not** use database name `neonbite-cafe`.

---

## 1B. Load data into pizzerio-bites (choose one)

### Option A — Import from local backup (NeonBite never touched)

A read-only snapshot was saved to `backup/pizzerio-bites-seed/` (or run export once from NeonBite — that only **reads**, it does not change NeonBite).

After `NEW_MONGODB_URI` is set:

```powershell
npm run db:import
```

The script **refuses** to import into `neonbite-cafe` or any database name containing `neonbite`.

Then point this project at the new DB only:

```env
MONGODB_URI=<same as NEW_MONGODB_URI>
```

### Option B — Fresh start (no NeonBite data at all)

Skip import. Set `MONGODB_URI` to your new pizzerio-bites URI and seed defaults:

```powershell
npm run seed --prefix server
```

---

## Verify

```powershell
npm run dev
```

- Pizzerio Bites admin → new `pizzerio-bites` database  
- NeonBite site/admin → still uses its own `neonbite-cafe` URI in **its** project  

---

## Safety

- `npm run db:import` requires `NEW_MONGODB_URI` and database name `pizzerio-bites`
- Import is blocked if the target looks like NeonBite
- NeonBite production is unaffected
