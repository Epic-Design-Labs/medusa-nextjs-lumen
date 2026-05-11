"use client"

import { useEffect, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import {
  listMyAddresses,
  addMyAddress,
  deleteMyAddress,
  updateMyAddress,
} from "@/lib/customer-client"
import { toast } from "sonner"

type Address = HttpTypes.StoreCustomerAddress

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "us",
}

export default function AddressesPage() {
  const { isReady } = useAuthGuard()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isReady) return
    let cancelled = false
    listMyAddresses().then((a) => {
      if (!cancelled) setAddresses(a)
    })
    return () => {
      cancelled = true
    }
  }, [isReady])

  if (!isReady) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const next = await addMyAddress({
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        address_2: form.address_2 || undefined,
        city: form.city,
        province: form.province || undefined,
        postal_code: form.postal_code,
        country_code: form.country_code.toLowerCase(),
        is_default_shipping: addresses.length === 0,
      })
      setAddresses(next)
      toast.success("Address added")
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
    } catch (err) {
      console.error(err)
      toast.error("Couldn't save address")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await deleteMyAddress(id)
      setAddresses((cur) => cur.filter((a) => a.id !== id))
      toast("Address removed")
    } catch {
      toast.error("Couldn't remove address")
    }
  }

  async function handleSetDefault(id: string, kind: "shipping" | "billing") {
    try {
      const next = await updateMyAddress(
        id,
        kind === "shipping"
          ? { is_default_shipping: true }
          : { is_default_billing: true }
      )
      setAddresses(next)
      toast.success(`Set as default ${kind}`)
    } catch {
      toast.error("Couldn't update address")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader title="Addresses">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </PageHeader>

      {showForm && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input name="first_name" value={form.first_name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input name="last_name" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address line 1</Label>
                <Input name="address_1" value={form.address_1} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Address line 2 (optional)</Label>
                <Input name="address_2" value={form.address_2} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>State / Province</Label>
                  <Input name="province" value={form.province} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Postal code</Label>
                  <Input name="postal_code" value={form.postal_code} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country (ISO-2)</Label>
                <Input name="country_code" value={form.country_code} onChange={handleChange} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Address"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !showForm && (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add an address to speed up checkout."
        />
      )}

      {addresses.length > 0 && (
        <div className="mt-8 space-y-4">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardContent className="flex items-start justify-between pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {addr.first_name} {addr.last_name}
                    </p>
                    {addr.is_default_shipping && (
                      <Badge variant="secondary" className="text-xs">
                        Default shipping
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {addr.address_1}
                    {addr.address_2 ? `, ${addr.address_2}` : ""}
                    <br />
                    {addr.city}
                    {addr.province ? `, ${addr.province}` : ""} {addr.postal_code}
                    <br />
                    {addr.country_code?.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-start gap-1">
                  {!addr.is_default_shipping && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(addr.id, "shipping")}
                      className="text-xs"
                    >
                      Default shipping
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(addr.id)}
                    aria-label="Remove address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
