"use client";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { escrowAbi, escrowAddress } from "../lib/contract";

const short = (value?: string) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";

function Milestone({ id, canApprove }: { id: number; canApprove: boolean }) {
  const { data } = useReadContract({ address: escrowAddress!, abi: escrowAbi, functionName: "getMilestone", args: [BigInt(id)] });
  const { writeContract, isPending } = useWriteContract();
  if (!data) return null;
  const statuses = ["Menunggu", "Dikirim", "Disengketakan", "Dirilis", "Diselesaikan"];
  return <div className="row"><span>Milestone {id + 1} · {formatEther(data.amount)} ETH · {statuses[data.status]}</span>
    {canApprove && data.status === 1 && <button disabled={isPending} onClick={() => writeContract({ address: escrowAddress!, abi: escrowAbi, functionName: "approveMilestone", args: [BigInt(id)] })}>{isPending ? "Memproses…" : "Approve & release"}</button>}
  </div>;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, isPending } = useWriteContract();
  const contract = { address: escrowAddress!, abi: escrowAbi };
  const enabled = Boolean(escrowAddress);
  const { data: client } = useReadContract({ ...contract, functionName: "client", query: { enabled } });
  const { data: freelancer } = useReadContract({ ...contract, functionName: "freelancer", query: { enabled } });
  const { data: total } = useReadContract({ ...contract, functionName: "totalAmount", query: { enabled } });
  const { data: balance } = useReadContract({ ...contract, functionName: "remainingBalance", query: { enabled } });
  const { data: funded } = useReadContract({ ...contract, functionName: "funded", query: { enabled } });
  const { data: count } = useReadContract({ ...contract, functionName: "milestoneCount", query: { enabled } });

  if (!enabled) return <main><h1>MicroEscrow</h1><div className="notice">Atur NEXT_PUBLIC_ESCROW_ADDRESS dengan alamat kontrak Sepolia.</div></main>;
  const isClient = address?.toLowerCase() === client?.toLowerCase();

  return <main>
    <header><div><span className="eyebrow">SEPOLIA TESTNET</span><h1>MicroEscrow</h1></div>{isConnected ? <button className="secondary" onClick={() => disconnect()}>{short(address)}</button> : <button onClick={() => connect({ connector: connectors[0] })}>Connect MetaMask</button>}</header>
    <section className="hero"><p>Dana aman. Progress transparan.</p><h2>Escrow milestone untuk kerja freelance.</h2></section>
    <section className="grid">
      <article><label>Status</label><strong>{funded ? "Terdanai" : "Menunggu dana"}</strong></article>
      <article><label>Total kontrak</label><strong>{total !== undefined ? formatEther(total) : "—"} ETH</strong></article>
      <article><label>Sisa terkunci</label><strong>{balance !== undefined ? formatEther(balance) : "—"} ETH</strong></article>
    </section>
    <section className="panel"><h3>Pihak kontrak</h3><div className="row"><span>Client</span><code>{client ?? "Memuat…"}</code></div><div className="row"><span>Freelancer</span><code>{freelancer ?? "Memuat…"}</code></div></section>
    <section className="panel"><h3>Milestone</h3>{Array.from({ length: Number(count ?? 0n) }, (_, id) => <Milestone key={id} id={id} canApprove={Boolean(isClient)} />)}</section>
    {isClient && !funded && total !== undefined && <button disabled={isPending} onClick={() => writeContract({ ...contract, functionName: "fund", value: total })}>{isPending ? "Konfirmasi di wallet…" : `Deposit ${formatEther(total)} ETH`}</button>}
    <p className="warning">Hanya gunakan ETH testnet Sepolia. Kontrak belum diaudit untuk mainnet.</p>
  </main>;
}
