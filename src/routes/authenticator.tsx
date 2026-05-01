import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  Search,
  QrCode,
  Clock,
  Edit2,
  X,
  ScanLine,
  KeyRound,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSync } from "otplib";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/authenticator")({
  component: AuthenticatorPage,
});

type ExternalToken = {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  created_at: string;
};

function useTotp(secret: string) {
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    if (!secret) return;

    const update = () => {
      try {
        const token = generateSync({ secret });
        setCode(token);
        const epoch = Math.floor(Date.now() / 1000);
        setRemaining(30 - (epoch % 30));
      } catch {
        setCode("------");
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  return { code, remaining };
}

function TokenCard({ token, onDelete }: { token: ExternalToken; onDelete: (id: string) => void }) {
  const { code, remaining } = useTotp(token.secret);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copié");
    setTimeout(() => setCopied(false), 1500);
  };

  const progressPct = (remaining / 30) * 100;
  const isLow = remaining <= 5;

  return (
    <div className="group relative rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)] hover:border-primary/20">
      {/* Timer ring */}
      <div className="absolute top-4 right-4">
        <svg width="36" height="36" viewBox="0 0 36 36" className="transform -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${(progressPct / 100) * 94.25} 94.25`}
            className={`transition-all duration-1000 ${isLow ? "text-destructive" : "text-primary"}`}
            stroke="currentColor"
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold ${isLow ? "text-destructive" : "text-muted-foreground"}`}
        >
          {remaining}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-bold">
          {token.issuer.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{token.issuer}</p>
          <p className="text-xs text-muted-foreground truncate">{token.account}</p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-3 rounded-lg bg-muted/50 hover:bg-muted py-3 px-4 transition-colors cursor-pointer"
      >
        <span
          className={`font-mono text-2xl font-bold tracking-[0.3em] ${isLow ? "text-destructive animate-pulse" : "text-foreground"}`}
        >
          {code.slice(0, 3)} {code.slice(3)}
        </span>
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
        )}
      </button>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(token.id)}
          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AuthenticatorPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<ExternalToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Add form state
  const [issuer, setIssuer] = useState("");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");
  const [adding, setAdding] = useState(false);

  // QR scan state
  const [qrInput, setQrInput] = useState("");

  useEffect(() => {
    document.title = "Authenticator — SentinelMFA";
  }, []);

  const loadTokens = useCallback(async () => {
    const { data, error } = await supabase
      .from("authenticator_tokens")
      .select("id, issuer, account, secret, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Impossible de charger les tokens");
      return;
    }
    setTokens(data ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({
          to: "/login",
          search: { mode: "login", redirect: "/authenticator" },
        });
        return;
      }
      if (!mounted) return;
      setUser(data.session.user);
      await loadTokens();
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session)
        navigate({
          to: "/login",
          search: { mode: "login", redirect: "/authenticator" },
        });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, loadTokens]);

  const handleAdd = async () => {
    if (!issuer.trim() || !secret.trim()) {
      toast.error("L'émetteur et le secret sont requis");
      return;
    }
    setAdding(true);
    try {
      // Validate the secret by generating a code
      try {
        generateSync({ secret: secret.replace(/\s/g, "").toUpperCase() });
      } catch {
        toast.error("Secret invalide. Vérifiez la clé saisie.");
        setAdding(false);
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Non authentifié");

      const { error } = await supabase.from("authenticator_tokens").insert({
        user_id: currentUser.id,
        issuer: issuer.trim(),
        account: account.trim() || currentUser.email || "default",
        secret: secret.replace(/\s/g, "").toUpperCase(),
      });
      if (error) throw error;

      toast.success("Token ajouté");
      setAddOpen(false);
      setIssuer("");
      setAccount("");
      setSecret("");
      loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAdding(false);
    }
  };

  const handleParseOtpAuth = async () => {
    const uri = qrInput.trim();
    if (!uri.startsWith("otpauth://totp/")) {
      toast.error("URI otpauth:// invalide");
      return;
    }
    try {
      const url = new URL(uri);
      const parsedSecret = url.searchParams.get("secret") || "";
      const parsedIssuer =
        url.searchParams.get("issuer") ||
        decodeURIComponent(url.pathname.split("/").pop()?.split(":")[0] || "");
      const parsedAccount =
        decodeURIComponent(url.pathname.split("/").pop()?.split(":")[1] || "") || user?.email || "";

      if (!parsedSecret) {
        toast.error("Aucun secret trouvé dans l'URI");
        return;
      }

      setIssuer(parsedIssuer);
      setAccount(parsedAccount);
      setSecret(parsedSecret);
      setScanOpen(false);
      setAddOpen(true);
      setQrInput("");
    } catch {
      toast.error("Format URI invalide");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("authenticator_tokens").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Token supprimé");
    loadTokens();
  };

  const filtered = tokens.filter(
    (t) =>
      t.issuer.toLowerCase().includes(search.toLowerCase()) ||
      t.account.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              Authenticator
            </h1>
            <p className="mt-2 text-muted-foreground">
              Votre coffre-fort de codes 2FA. Utilisez SentinelMFA comme alternative à Google
              Authenticator.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setScanOpen(true)} variant="outline" size="sm">
              <QrCode className="h-4 w-4" />
              Scanner un QR
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Ajouter un compte
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border bg-accent/30 p-5 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Comment ça fonctionne ?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez vos comptes en scannant un QR code ou en saisissant manuellement la clé
                secrète. SentinelMFA génère automatiquement les codes à 6 chiffres qui se
                renouvellent toutes les 30 secondes, exactement comme Google Authenticator ou Authy.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        {tokens.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un service..."
              className="pl-9"
            />
          </div>
        )}

        {/* Token grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
              <QrCode className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-lg">
              {search ? "Aucun résultat" : "Aucun compte ajouté"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {search
                ? "Essayez une autre recherche."
                : "Ajoutez votre premier compte pour commencer à générer des codes de vérification."}
            </p>
            {!search && (
              <div className="mt-6 flex gap-3 justify-center">
                <Button onClick={() => setScanOpen(true)} variant="outline">
                  <QrCode className="h-4 w-4" />
                  Scanner un QR code
                </Button>
                <Button
                  onClick={() => setAddOpen(true)}
                  className="bg-[image:var(--gradient-primary)]"
                >
                  <Plus className="h-4 w-4" />
                  Saisie manuelle
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((token) => (
              <TokenCard key={token.id} token={token} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Ajouter un compte
            </DialogTitle>
            <DialogDescription>Saisissez les informations du service à protéger.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-issuer">Service / Émetteur</Label>
              <Input
                id="add-issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="Google, GitHub, AWS..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-account">Compte (email/identifiant)</Label>
              <Input
                id="add-account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="vous@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-secret">Clé secrète (Base32)</Label>
              <Input
                id="add-secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="JBSWY3DPEHPK3PXP..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                La clé secrète fournie par le service lors de l'activation du 2FA.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-[image:var(--gradient-primary)]"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajouter le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan / Paste otpauth URI Dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scanner ou coller un QR code
            </DialogTitle>
            <DialogDescription>
              Collez l'URI otpauth:// que vous avez copiée ou extraite du QR code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
              <Camera className="h-10 w-10 text-primary/50 mx-auto mb-3" />
              <p className="text-sm font-medium">Scan de QR code</p>
              <p className="text-xs text-muted-foreground mt-1">
                Utilisez votre appareil pour scanner le QR code puis collez l'URI ci-dessous.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-uri">URI otpauth://</Label>
              <Input
                id="qr-uri"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="otpauth://totp/Service:user@email.com?secret=..."
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleParseOtpAuth}
              disabled={!qrInput.trim()}
              className="w-full bg-[image:var(--gradient-primary)]"
            >
              <ScanLine className="h-4 w-4" />
              Importer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
