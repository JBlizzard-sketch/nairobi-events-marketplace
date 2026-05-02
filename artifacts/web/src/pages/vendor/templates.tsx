import { useState } from "react";
import { useQuoteTemplates, type QuoteTemplate, type QuoteLineItem } from "@/hooks/use-quote-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BookTemplate, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  FileText, Package, DollarSign, Clock, Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DraftTemplate = Omit<QuoteTemplate, "id" | "createdAt">;

const EMPTY_LINE_ITEM: QuoteLineItem = { description: "", quantity: 1, unitPrice: 0, total: 0 };

function emptyDraft(): DraftTemplate {
  return {
    name: "",
    lineItems: [{ ...EMPTY_LINE_ITEM }],
    inclusions: "",
    exclusions: "",
    terms: "",
    depositPercent: 30,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function formatKES(n: number) {
  return `KES ${n.toLocaleString()}`;
}

// ── Line item editor row ───────────────────────────────────────────────────────

function LineItemRow({
  item,
  index,
  onChange,
  onRemove,
  isOnly,
}: {
  item: QuoteLineItem;
  index: number;
  onChange: (index: number, field: keyof QuoteLineItem, value: string | number) => void;
  onRemove: (index: number) => void;
  isOnly: boolean;
}) {
  const handleQty = (val: string) => {
    const qty = Math.max(1, parseInt(val) || 1);
    onChange(index, "quantity", qty);
    onChange(index, "total", qty * item.unitPrice);
  };
  const handlePrice = (val: string) => {
    const price = Math.max(0, parseFloat(val) || 0);
    onChange(index, "unitPrice", price);
    onChange(index, "total", item.quantity * price);
  };

  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_64px_90px_90px_36px] gap-2 items-center min-w-[400px]">
      <Input
        placeholder="Service or item description"
        value={item.description}
        onChange={e => onChange(index, "description", e.target.value)}
        className="text-sm"
      />
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        placeholder="Qty"
        value={item.quantity}
        onChange={e => handleQty(e.target.value)}
        className="text-sm text-center"
      />
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="Unit price"
        value={item.unitPrice || ""}
        onChange={e => handlePrice(e.target.value)}
        className="text-sm"
      />
      <div className="text-sm font-medium text-right pr-1">
        {formatKES(item.total)}
      </div>
      <button
        onClick={() => onRemove(index)}
        disabled={isOnly}
        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
        aria-label="Remove line"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Template form dialog ───────────────────────────────────────────────────────

function TemplateDialog({
  initial,
  open,
  onOpenChange,
  onSave,
  title,
}: {
  initial: DraftTemplate;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (draft: DraftTemplate) => void;
  title: string;
}) {
  const [draft, setDraft] = useState<DraftTemplate>(initial);

  const setField = <K extends keyof DraftTemplate>(key: K, val: DraftTemplate[K]) =>
    setDraft(prev => ({ ...prev, [key]: val }));

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
    setDraft(prev => {
      const items = [...prev.lineItems];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, lineItems: items };
    });
  };

  const addLine = () =>
    setDraft(prev => ({ ...prev, lineItems: [...prev.lineItems, { ...EMPTY_LINE_ITEM }] }));

  const removeLine = (i: number) =>
    setDraft(prev => ({ ...prev, lineItems: prev.lineItems.filter((_, idx) => idx !== i) }));

  const totalAmount = draft.lineItems.reduce((s, l) => s + l.total, 0);
  const depositAmount = Math.round((totalAmount * draft.depositPercent) / 100);

  const canSave = draft.name.trim().length > 0 && draft.lineItems.every(l => l.description.trim());

  const handleSave = () => {
    if (!canSave) return;
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setDraft(initial); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Save a reusable template to speed up quote submissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g. Corporate Lunch Package, Wedding Photography Standard"
              value={draft.name}
              onChange={e => setField("name", e.target.value)}
            />
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                Total: {formatKES(totalAmount)}
              </div>
            </div>

            <div className="overflow-x-auto -mx-1 px-1">
            {/* Header row */}
            <div className="grid grid-cols-[minmax(120px,1fr)_64px_90px_90px_36px] gap-2 min-w-[400px]">
              <p className="text-xs text-muted-foreground font-medium">Description</p>
              <p className="text-xs text-muted-foreground font-medium text-center">Qty</p>
              <p className="text-xs text-muted-foreground font-medium">Unit Price</p>
              <p className="text-xs text-muted-foreground font-medium text-right pr-1">Total</p>
              <span />
            </div>

            <div className="space-y-2 mt-2">
              {draft.lineItems.map((item, i) => (
                <LineItemRow
                  key={i}
                  item={item}
                  index={i}
                  onChange={updateLineItem}
                  onRemove={removeLine}
                  isOnly={draft.lineItems.length === 1}
                />
              ))}
            </div>
            </div>{/* /overflow-x-auto */}

            <Button variant="outline" size="sm" className="gap-1.5" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" />
              Add Line Item
            </Button>
          </div>

          <Separator />

          {/* Deposit */}
          <div className="space-y-2">
            <Label>Deposit Required (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={draft.depositPercent}
                onChange={e => setField("depositPercent", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-24"
              />
              <p className="text-sm text-muted-foreground">
                {totalAmount > 0 ? `= ${formatKES(depositAmount)} upfront` : "Set line items to see deposit amount"}
              </p>
            </div>
          </div>

          {/* Inclusions */}
          <div className="space-y-2">
            <Label>What's Included</Label>
            <Textarea
              placeholder="e.g. Setup and teardown, serving staff, equipment, travel within Nairobi..."
              value={draft.inclusions}
              onChange={e => setField("inclusions", e.target.value)}
              rows={3}
            />
          </div>

          {/* Exclusions */}
          <div className="space-y-2">
            <Label>Exclusions</Label>
            <Textarea
              placeholder="e.g. Venue hire, alcohol, accommodation..."
              value={draft.exclusions}
              onChange={e => setField("exclusions", e.target.value)}
              rows={2}
            />
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              placeholder="e.g. Cancellation policy, payment schedule, force majeure..."
              value={draft.terms}
              onChange={e => setField("terms", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave} className="gap-2">
            <BookTemplate className="h-4 w-4" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: QuoteTemplate;
  onEdit: (t: QuoteTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalAmount = template.lineItems.reduce((s, l) => s + l.total, 0);
  const depositAmount = Math.round((totalAmount * template.depositPercent) / 100);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0 mt-0.5">
              <BookTemplate className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-base leading-snug">{template.name}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  {template.lineItems.length} line {template.lineItems.length === 1 ? "item" : "items"}
                </span>
                {totalAmount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    {formatKES(totalAmount)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(template.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(template)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete template?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{template.name}" will be permanently removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(template.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 space-y-4">
            <Separator />

            {/* Line items breakdown */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Line Items</p>
              <div className="space-y-1.5">
                {template.lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="text-foreground">{item.description || "(untitled)"}</span>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span>{item.quantity} × {formatKES(item.unitPrice)}</span>
                      <span className="font-semibold text-foreground w-24 text-right">{formatKES(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold mt-3 pt-3 border-t border-border">
                <span>Total</span>
                <span>{formatKES(totalAmount)}</span>
              </div>
              {template.depositPercent > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Deposit ({template.depositPercent}%)</span>
                  <span>{formatKES(depositAmount)}</span>
                </div>
              )}
            </div>

            {/* Inclusions / Exclusions / Terms */}
            {[
              { label: "Inclusions", value: template.inclusions },
              { label: "Exclusions", value: template.exclusions },
              { label: "Terms", value: template.terms },
            ].filter(f => f.value?.trim()).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorTemplates() {
  const { templates, saveTemplate, removeTemplate } = useQuoteTemplates();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuoteTemplate | null>(null);

  const handleCreate = (draft: DraftTemplate) => {
    saveTemplate(draft);
  };

  const handleEdit = (draft: DraftTemplate) => {
    if (!editTarget) return;
    removeTemplate(editTarget.id);
    saveTemplate(draft);
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    removeTemplate(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quote Templates</h1>
          <p className="text-muted-foreground mt-1">
            Build reusable templates to submit quotes faster when requests come in.
          </p>
        </div>
        <Button className="gap-2 font-semibold flex-shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3.5">
        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Templates are saved locally on your device. When you receive a quote request, you can load any template to pre-fill your line items, inclusions, exclusions, and payment terms — then adjust before submitting.
        </p>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="bg-muted/50 p-4 rounded-full w-16 h-16 mx-auto mb-5 flex items-center justify-center">
              <FileText className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-base mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Create your first template — set your standard line items, payment terms, and inclusions once, then reuse them for every quote.
            </p>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {templates.length} saved {templates.length === 1 ? "template" : "templates"}
            </p>
          </div>
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={tpl => setEditTarget(tpl)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <TemplateDialog
        title="New Quote Template"
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={emptyDraft()}
        onSave={handleCreate}
      />

      {/* Edit dialog */}
      {editTarget && (
        <TemplateDialog
          title={`Edit "${editTarget.name}"`}
          open={!!editTarget}
          onOpenChange={v => { if (!v) setEditTarget(null); }}
          initial={{
            name: editTarget.name,
            lineItems: editTarget.lineItems,
            inclusions: editTarget.inclusions,
            exclusions: editTarget.exclusions,
            terms: editTarget.terms,
            depositPercent: editTarget.depositPercent,
          }}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}
