import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { 
  getFestivals,
  createFestival as apiCreateFestival,
  addBucketItem as apiAddBucketItem,
  updateBucketItem as apiUpdateBucketItem,
  deleteBucketItem,
  type FestivalDTO,
  type BucketItemDTO
} from "@/api/festivalsService";

type Festival = FestivalDTO;
type BucketItem = BucketItemDTO;

const FestiveBucketList = () => {
  const navigate = useNavigate();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [openFestival, setOpenFestival] = useState<Festival | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newFestivalName, setNewFestivalName] = useState("");
  const [newFestivalDescription, setNewFestivalDescription] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");

  // Load festivals on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getFestivals();
        setFestivals(data);
      } catch (e) {
        toast.error("Failed to load festivals");
      }
    })();
  }, []);

  const addFestival = async () => {
    const name = newFestivalName.trim();
    const description = newFestivalDescription.trim();
    if (!name) return;
    try {
      const created = await apiCreateFestival({ name, description });
      setFestivals(prev => [created, ...prev]);
      setNewFestivalName("");
      setNewFestivalDescription("");
      setAddOpen(false);
      toast.success("Festival created");
    } catch (e) {
      toast.error("Failed to create festival");
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
          <h1 className="text-2xl font-bold">Festive Bucket List</h1>
        </div>
        <Button onClick={() => setAddOpen(true)}>Add Festival</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {festivals.map((festival) => (
          <Card key={festival._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{festival.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{festival.description}</p>
              <Button onClick={() => setOpenFestival(festival)} className="w-full">
                View Bucket List
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Festival</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="festival-name">Festival Name</Label>
              <Input
                id="festival-name"
                placeholder="Enter festival name"
                value={newFestivalName}
                onChange={(e) => setNewFestivalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="festival-description">Description</Label>
              <Input
                id="festival-description"
                placeholder="Optional short description"
                value={newFestivalDescription}
                onChange={(e) => setNewFestivalDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addFestival} disabled={!newFestivalName.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openFestival} onOpenChange={(open) => !open && setOpenFestival(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openFestival?.name} Bucket List</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddItem((v) => !v)}>
              {showAddItem ? "Close" : "Add Bucket List Item"}
            </Button>
          </div>

          {showAddItem && (
            <div className="space-y-3 rounded-md border p-4 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Bucket List Name</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g. Buy diyas"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-amount">Amount</Label>
                  <Input
                    id="item-amount"
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemName("");
                    setNewItemPrice("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!openFestival) return;
                    const name = newItemName.trim();
                    const price = parseFloat(newItemPrice);
                    if (!name || isNaN(price)) return;
                    try {
                      const updated = await apiAddBucketItem(openFestival._id, { label: name, price });
                      setFestivals(prev => prev.map(f => f._id === updated._id ? updated : f));
                      setOpenFestival(updated);
                      setNewItemName("");
                      setNewItemPrice("");
                      setShowAddItem(false);
                      toast.success("Item added");
                    } catch (e) {
                      toast.error("Failed to add item");
                    }
                  }}
                  disabled={!newItemName.trim() || newItemPrice.trim() === ""}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 py-2">
            {openFestival?.items.map((item) => {
              const key = `${openFestival._id}:${item._id}`;
              const value = !!item.completed;
              const isEditing = editingItemId === item._id;
              return (
                <div key={item._id} className="space-y-2">
                  {!isEditing ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox id={key} checked={value} onCheckedChange={async () => {
                          if (!openFestival) return;
                          try {
                            const updated = await apiUpdateBucketItem(openFestival._id, item._id, { completed: !value });
                            setFestivals(prev => prev.map(f => f._id === updated._id ? updated : f));
                            setOpenFestival(updated);
                          } catch (e) {
                            toast.error("Failed to update item status");
                          }
                        }} />
                        <label htmlFor={key} className={`text-sm ${value ? "line-through text-muted-foreground" : ""}`}>
                          {item.label}
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {typeof item.price === 'number' ? `₹${item.price.toLocaleString()}` : "—"}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingItemId(item._id);
                          setEditItemName(item.label);
                          setEditItemPrice((item.price ?? 0).toString());
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => {
                          if (!openFestival) return;
                          if (!confirm('Delete this item?')) return;
                          try {
                            const updated = await deleteBucketItem(openFestival._id, item._id);
                            setFestivals(prev => prev.map(f => f._id === updated._id ? updated : f));
                            setOpenFestival(updated);
                            toast.success('Item deleted');
                          } catch (e) {
                            toast.error('Failed to delete item');
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div className="md:col-span-3 space-y-2">
                        <Label htmlFor={`edit-name-${item._id}`}>Name</Label>
                        <Input id={`edit-name-${item._id}`} value={editItemName} onChange={(e) => setEditItemName(e.target.value)} />
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <Label htmlFor={`edit-price-${item._id}`}>Amount</Label>
                        <Input id={`edit-price-${item._id}`} type="number" min="0" value={editItemPrice} onChange={(e) => setEditItemPrice(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => {
                            setEditingItemId(null);
                            setEditItemName("");
                            setEditItemPrice("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          onClick={async () => {
                            if (!openFestival) return;
                            const label = editItemName.trim();
                            const price = parseFloat(editItemPrice);
                            if (!label || isNaN(price)) return;
                            try {
                              const updated = await apiUpdateBucketItem(openFestival._id, item._id, { label, price });
                              setFestivals(prev => prev.map(f => f._id === updated._id ? updated : f));
                              setOpenFestival(updated);
                              setEditingItemId(null);
                              setEditItemName("");
                              setEditItemPrice("");
                              toast.success('Item updated');
                            } catch (e) {
                              toast.error('Failed to update item');
                            }
                          }}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>

          <DialogFooter>
            <div className="mr-auto text-sm font-medium">
              Total: {openFestival ? `₹${openFestival.items
                .reduce((sum, it) => sum + (typeof it.price === 'number' ? it.price : 0), 0)
                .toLocaleString()}` : '₹0'}
            </div>
            <Button variant="secondary" onClick={() => setOpenFestival(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FestiveBucketList;
