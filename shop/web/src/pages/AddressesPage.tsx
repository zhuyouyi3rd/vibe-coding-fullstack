import { useEffect, useState, type FormEvent } from 'react';
import { Edit3, MapPin, Plus, Trash2, X } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Address } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingScreen } from '../components/LoadingScreen';

const emptyForm = { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false };

export function AddressesPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api.get<{ data: Address[] }>('/addresses')
      .then(({ data }) => setAddresses(data.data))
      .catch((err) => toast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditing('new');
  };

  const openEdit = (address: Address) => {
    setForm({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
      isDefault: address.isDefault,
    });
    setEditing(address);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') {
        await api.post('/addresses', form);
        toast('收货地址已添加');
      } else if (editing) {
        await api.put(`/addresses/${editing.id}`, form);
        toast('收货地址已更新');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api.delete(`/addresses/${id}`);
      setConfirmId(null);
      toast('地址已删除');
      load();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="shell py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <span className="eyebrow">ADDRESS BOOK</span>
          <h1 className="mt-2 font-display text-3xl font-semibold">收货地址</h1>
          <p className="mt-1 text-xs text-ink-soft">管理你常用的收货信息，下单时可以直接选择。</p>
        </div>
        <button type="button" onClick={openNew} className="btn-brick"><Plus size={15} /> 添加地址</button>
      </div>

      {loading ? <LoadingScreen label="正在拿地址簿" /> : addresses.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-line py-16 text-center">
          <MapPin size={22} className="mx-auto text-olive" />
          <p className="mt-3 font-display text-lg">还没有收货地址</p>
          <button type="button" onClick={openNew} className="btn-brick mt-4">添加第一个地址</button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className={`rounded-md border p-4 ${address.isDefault ? 'border-brick/40 bg-brick/[0.03]' : 'border-line bg-panel/70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{address.name}</p>
                    <span className="text-[10px] text-ink-soft">{address.phone}</span>
                    {address.isDefault && <span className="status-badge bg-brick/10 text-brick-deep">默认</span>}
                  </div>
                  <p className="mt-2 text-[11px] leading-6 text-ink-soft">{address.province}{address.city}{address.district}{address.detail}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => openEdit(address)} aria-label="编辑地址" className="p-1.5 text-ink-soft hover:text-brick"><Edit3 size={14} /></button>
                  <button type="button" onClick={() => setConfirmId(address.id)} aria-label="删除地址" className="p-1.5 text-ink-soft hover:text-brick"><Trash2 size={14} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/30 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-line bg-panel p-5 shadow-2xl animate-rise">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{editing === 'new' ? '添加收货地址' : '编辑收货地址'}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="关闭" className="p-1 text-ink-soft"><X size={17} /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="addr-name" className="field-label">收货人</label><input id="addr-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" required /></div>
              <div><label htmlFor="addr-phone" className="field-label">手机号</label><input id="addr-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="field" required /></div>
              <div><label htmlFor="addr-province" className="field-label">省份</label><input id="addr-province" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="field" required /></div>
              <div><label htmlFor="addr-city" className="field-label">城市</label><input id="addr-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="field" required /></div>
              <div><label htmlFor="addr-district" className="field-label">区县</label><input id="addr-district" value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} className="field" required /></div>
              <div className="sm:col-span-2"><label htmlFor="addr-detail" className="field-label">详细地址</label><input id="addr-detail" value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} className="field" required /></div>
              <label className="flex items-center gap-2 text-[11px] text-ink-soft sm:col-span-2"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} /> 设为默认地址</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">取消</button>
              <button type="submit" disabled={saving} className="btn-brick">{saving ? '保存中…' : '保存地址'}</button>
            </div>
          </form>
        </div>
      )}

      {confirmId !== null && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md border border-line bg-panel p-5 shadow-2xl animate-rise">
            <h3 className="font-display text-lg font-semibold">删除这个地址？</h3>
            <p className="mt-2 text-xs leading-6 text-ink-soft">删除后不可恢复。如果它是默认地址，会把剩余地址中的第一个设为默认。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmId(null)} className="btn-outline">取消</button>
              <button type="button" onClick={() => remove(confirmId)} className="rounded bg-brick px-3 py-1.5 text-xs font-semibold text-panel">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
