import "server-only";
import { and, eq } from "drizzle-orm";
import { db, milestones, projects, type Milestone, type Project } from "./db";
import { HttpError } from "./errors";
import { makeIntent, type Intent } from "./intent";
import { tw } from "./trustless";
import { contractIdFromTx, signAsPlatform, txHash } from "./stellar-server";

export async function loadProject(id: string): Promise<Project & { milestones: Milestone[] }> {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) throw new HttpError(404, "Project not found");
  const ms = await db.select().from(milestones).where(eq(milestones.projectId, id)).orderBy(milestones.idx);
  return { ...project, milestones: ms };
}

function milestoneAt(p: { milestones: Milestone[] }, idx: number) {
  const m = p.milestones.find((x) => x.idx === idx);
  if (!m) throw new HttpError(404, "Milestone not found");
  return m;
}

export type EscrowAction = "deploy" | "fund" | "done" | "approve" | "dispute";

/** Step 1 of every user-signed escrow action: validate, ask Trustless Work for the unsigned tx, bind it to an intent. */
export async function prepareAction(
  projectId: string,
  action: EscrowAction,
  address: string,
  body: { idx?: number; evidence?: string; reason?: string },
) {
  const p = await loadProject(projectId);
  const isClient = address === p.clientAddress;
  const isLead = address === p.leadAddress;

  switch (action) {
    case "deploy": {
      if (p.contractId) throw new HttpError(409, "The escrow already exists");
      if (!isClient && !isLead) throw new HttpError(403, "Only the client or the team lead can create this escrow");
      const xdr = await tw.deploy({
        signer: address,
        engagementId: p.id,
        title: p.title,
        description: p.description,
        approver: p.clientAddress,
        serviceProvider: p.leadAddress,
        platformFee: p.platformFeePct,
        milestones: p.milestones.map((m) => ({
          description: `${m.description} · ${m.memberName}`,
          amount: m.amount,
          receiver: m.receiver,
        })),
      });
      return makeIntent({ kind: "deploy", projectId, signer: address }, xdr);
    }
    case "fund": {
      if (!p.contractId) throw new HttpError(409, "Create the escrow first");
      if (p.funded) throw new HttpError(409, "This escrow is already funded");
      if (!isClient) throw new HttpError(403, "Only the client can fund this escrow");
      const xdr = await tw.fund({ contractId: p.contractId, signer: address, amount: p.total });
      return makeIntent({ kind: "fund", projectId, signer: address }, xdr);
    }
    case "done": {
      const idx = Number(body.idx);
      const m = milestoneAt(p, idx);
      if (!p.funded || !p.contractId) throw new HttpError(409, "Wait for the client to lock the funds");
      if (!isLead) throw new HttpError(403, "Only the team lead marks milestones done");
      if (m.status !== "PENDING") throw new HttpError(409, "This milestone isn't open for delivery");
      const evidence = (body.evidence || "").trim();
      if (!evidence) throw new HttpError(400, "Add a link to the work (Figma, GitHub, Drive…)");
      const xdr = await tw.markDone({ contractId: p.contractId, milestoneIndex: idx, evidence, serviceProvider: address });
      return makeIntent({ kind: "done", projectId, idx, signer: address, evidence }, xdr);
    }
    case "approve": {
      const idx = Number(body.idx);
      const m = milestoneAt(p, idx);
      if (!p.contractId) throw new HttpError(409, "No escrow yet");
      if (!isClient) throw new HttpError(403, "Only the client approves work");
      if (m.status !== "DONE") throw new HttpError(409, "This milestone hasn't been marked done");
      const xdr = await tw.approve({ contractId: p.contractId, milestoneIndex: idx, approver: address });
      return makeIntent({ kind: "approve", projectId, idx, signer: address }, xdr);
    }
    case "dispute": {
      const idx = Number(body.idx);
      const m = milestoneAt(p, idx);
      if (!p.contractId || !p.funded) throw new HttpError(409, "Only funded escrows can be disputed");
      if (!isClient && !isLead) throw new HttpError(403, "Only the client or the team lead can raise a dispute");
      if (!["PENDING", "DONE"].includes(m.status)) throw new HttpError(409, "This milestone can't be disputed now");
      const reason = (body.reason || "").trim();
      if (reason.length < 5) throw new HttpError(400, "Say briefly what went wrong");
      const xdr = await tw.dispute({ contractId: p.contractId, milestoneIndex: idx, signer: address });
      return makeIntent({ kind: "dispute", projectId, idx, signer: address, reason: reason.slice(0, 500) }, xdr);
    }
  }
}

/** Step 2: send the signed transaction and record what happened. */
export async function submitAction(intent: Intent, signedXdr: string) {
  if (intent.kind === "pay") throw new HttpError(400, "Wrong endpoint for a pay link");
  const res = await tw.send(signedXdr);
  if (res?.status === "FAILED") throw new HttpError(400, res.message || "Stellar rejected the transaction");
  const hash = txHash(signedXdr);

  switch (intent.kind) {
    case "deploy": {
      const contractId = res.contractId || (await contractIdFromTx(hash));
      if (!contractId) throw new HttpError(502, "Escrow deployed but the contract id wasn't returned. Check the transaction on the explorer.");
      await db.update(projects).set({ contractId, deployTx: hash }).where(eq(projects.id, intent.projectId));
      return { hash, contractId };
    }
    case "fund":
      await db.update(projects).set({ funded: true, fundTx: hash }).where(eq(projects.id, intent.projectId));
      return { hash };
    case "done":
      await setMilestone(intent.projectId, intent.idx, { status: "DONE", evidence: intent.evidence });
      return { hash };
    case "dispute":
      await setMilestone(intent.projectId, intent.idx, {
        status: "DISPUTED",
        disputeBy: intent.signer,
        disputeReason: intent.reason,
        disputeTx: hash,
      });
      return { hash };
    case "approve": {
      await setMilestone(intent.projectId, intent.idx, { status: "APPROVED", approveTx: hash });
      // The client approved, so the Platform account releases this person's share right away.
      try {
        const releaseTx = await releaseMilestone(intent.projectId, intent.idx);
        return { hash, releaseTx };
      } catch (e) {
        return { hash, releaseError: e instanceof Error ? e.message : "Release failed, retry from the project page" };
      }
    }
  }
}

function setMilestone(projectId: string, idx: number, values: Partial<Milestone>) {
  return db
    .update(milestones)
    .set(values)
    .where(and(eq(milestones.projectId, projectId), eq(milestones.idx, idx)));
}

/**
 * Release one milestone, signed by the Platform account on the server.
 * We never trust our own database for this: the escrow on Stellar must say the
 * milestone is approved, not released and not disputed.
 */
export async function releaseMilestone(projectId: string, idx: number): Promise<string> {
  const p = await loadProject(projectId);
  const m = milestoneAt(p, idx);
  if (!p.contractId) throw new HttpError(409, "No escrow");
  if (m.status === "RELEASED") return m.releaseTx || "";
  if (m.status !== "APPROVED") throw new HttpError(409, "The client hasn't approved this milestone");

  let onChain = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const escrow = await tw.getEscrow(p.contractId).catch(() => null);
    onChain = escrow?.milestones?.[idx]?.flags;
    if (onChain?.approved) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!onChain?.approved) throw new HttpError(409, "Stellar doesn't show this milestone as approved yet. Retry in a few seconds.");
  if (onChain.disputed) throw new HttpError(409, "This milestone is in dispute");
  if (onChain.released) {
    await setMilestone(projectId, idx, { status: "RELEASED" });
    return m.releaseTx || "";
  }

  const unsignedXdr = await tw.release({ contractId: p.contractId, milestoneIndex: idx });
  const signed = signAsPlatform(unsignedXdr);
  const res = await tw.send(signed);
  if (res?.status === "FAILED") throw new HttpError(502, res.message || "Release failed");
  const hash = txHash(signed);
  await setMilestone(projectId, idx, { status: "RELEASED", releaseTx: hash });
  return hash;
}

/** Admin: split a disputed milestone between the member and the client, in one transaction. */
export async function resolveDispute(projectId: string, idx: number, toReceiverPct: number) {
  const p = await loadProject(projectId);
  const m = milestoneAt(p, idx);
  if (!p.contractId) throw new HttpError(409, "No escrow");
  if (m.status !== "DISPUTED") throw new HttpError(409, "This milestone isn't in dispute");
  const pct = Math.min(100, Math.max(0, Math.round(toReceiverPct)));
  const toReceiver = Number(((m.amount * pct) / 100).toFixed(7));
  const toClient = Number((m.amount - toReceiver).toFixed(7));
  const distributions = [
    { address: m.receiver, amount: toReceiver },
    { address: p.clientAddress, amount: toClient },
  ].filter((d) => d.amount > 0);

  const unsignedXdr = await tw.resolve({ contractId: p.contractId, milestoneIndex: idx, distributions });
  const signed = signAsPlatform(unsignedXdr);
  const res = await tw.send(signed);
  if (res?.status === "FAILED") throw new HttpError(502, res.message || "Resolution failed");
  const hash = txHash(signed);
  await setMilestone(projectId, idx, { status: "RESOLVED", resolveTx: hash, toReceiver, toClient });
  return { hash, toReceiver, toClient };
}
